"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCustomer } from "@/components/customer-auth-provider";

/**
 * Customer login / signup — one page, two tabs, Flipkart-style:
 * the same form switches between "Log in" and "Create account".
 */
function LoginInner() {
  const { user, loading, login, register } = useCustomer();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === "login") {
        const err = await login(email.trim(), password);
        if (err) setError(err);
        else router.replace(next);
      } else {
        if (!name.trim()) {
          setError("Please enter your name.");
          setBusy(false);
          return;
        }
        if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
          setError("Enter a valid 10-digit Indian mobile number.");
          setBusy(false);
          return;
        }
        const err = await register(name.trim(), email.trim(), phone.trim(), password);
        if (err) setError(err);
        else router.replace(next);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <p className="text-center text-3xl">🛍️</p>
      <h1 className="mt-3 text-center text-2xl font-bold">
        {tab === "login" ? "Log in to Nova Threads" : "Create your account"}
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        {tab === "login"
          ? "Get your order history, saved addresses and faster checkout."
          : "One account for orders, wishlist and express checkout."}
      </p>

      {/* Tabs */}
      <div className="mt-8 grid grid-cols-2 rounded-full border border-neutral-200 p-1">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-semibold transition ${
              tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {t === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {tab === "signup" && (
          <input
            className={input}
            placeholder="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <input
          className={input}
          type="email"
          placeholder="Email address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {tab === "signup" && (
          <input
            className={input}
            placeholder="Mobile number *"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            autoComplete="tel"
          />
        )}
        <input
          className={input}
          type="password"
          placeholder={tab === "signup" ? "Create a password (min 6 chars) *" : "Password *"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={tab === "signup" ? "new-password" : "current-password"}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || loading}
          className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {busy
            ? tab === "login"
              ? "Logging in…"
              : "Creating account…"
            : tab === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-400">
        By continuing, you agree to Nova&nbsp;Threads&apos;{" "}
        <Link href="/support" className="underline underline-offset-2">
          Terms &amp; Privacy policy
        </Link>
        .
      </p>
      <p className="mt-4 text-center text-xs text-neutral-400">
        Just want to track an order?{" "}
        <Link href="/track" className="underline underline-offset-2">
          Track without logging in
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
