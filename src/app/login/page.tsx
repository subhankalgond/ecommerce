"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCustomer } from "@/components/customer-auth-provider";

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
          setError("Please provide your name.");
          setBusy(false);
          return;
        }
        if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
          setError("Please enter a valid 10-digit mobile number.");
          setBusy(false);
          return;
        }
        const err = await register(name.trim(), email.trim(), phone.trim(), password);
        if (err) setError(err);
        else router.replace(next);
      }
    } catch {
      setError("Network interruption — please re-attempt.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full border border-[#ded7ca] bg-white px-3.5 py-2.5 text-xs text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none transition";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="border border-[#ded7ca] bg-[#faf8f5] p-8 shadow-sm">
        <div className="text-center">
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Client Portal
          </span>
          <h1 className="mt-2 font-serif text-3xl text-[#171614]">
            {tab === "login" ? "Sign In to Your Account" : "Create Client Account"}
          </h1>
          <p className="mt-2 text-xs text-[#6b645b] leading-relaxed">
            {tab === "login"
              ? "Access order history, saved addresses, and expedited checkout."
              : "Register to manage orders, addresses, and wishlist items."}
          </p>
        </div>

        {/* Tab switch */}
        <div className="mt-6 grid grid-cols-2 border border-[#ded7ca] p-1 bg-[#f7f4ee]">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`py-2 text-xs font-semibold tracking-wider uppercase transition ${
                tab === t
                  ? "border border-[#171614] bg-[#171614] text-white"
                  : "text-[#5e574e] hover:text-[#171614]"
              }`}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {tab === "signup" && (
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Full Name *
              </label>
              <input
                className={inputCls}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
              Email Address *
            </label>
            <input
              className={inputCls}
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {tab === "signup" && (
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Mobile Number *
              </label>
              <input
                className={inputCls}
                placeholder="10-digit mobile"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                autoComplete="tel"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
              Password *
            </label>
            <input
              className={inputCls}
              type="password"
              placeholder={tab === "signup" ? "Create a password (min 6 characters)" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="border border-[#8b5a42] bg-[#fcf9f7] p-2.5 text-xs text-[#8b5a42] font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || loading}
            className="w-full border border-[#171614] bg-[#171614] py-3 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition disabled:opacity-50"
          >
            {busy
              ? tab === "login"
                ? "Authenticating…"
                : "Registering Account…"
              : tab === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-[#8c857b]">
          By proceeding, you agree to Nova Threads&apos;{" "}
          <Link href="/support#privacy" className="underline hover:text-[#171614]">
            Terms of Service &amp; Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-4 border-t border-[#ede6da] pt-4 text-center text-[11px] text-[#736c62]">
          Looking for a specific shipment?{" "}
          <Link href="/track" className="font-semibold text-[#171614] hover:underline">
            Track order without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="h-8 w-40 animate-pulse bg-[#ede8df]" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
