"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomer, type CustomerUser } from "@/components/customer-auth-provider";
import { formatPrice } from "@/lib/cart-format";
import type { SavedAddress } from "@/lib/order-types";

const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

type AddressForm = typeof EMPTY_FORM;

export default function AccountPage() {
  const { user, orders, loading, logout, refresh, saveUser } = useCustomer();
  const router = useRouter();

  const [tab, setTab] = useState<"orders" | "profile" | "addresses" | "password">("orders");
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [addrForm, setAddrForm] = useState<AddressForm | null>(null);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="h-8 w-52 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login?next=/account");
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-4xl">👤</p>
        <h1 className="mt-4 text-2xl font-bold">You&apos;re signed out</h1>
        <p className="mt-2 text-sm text-neutral-500">Log in to see your orders and saved addresses.</p>
        <Link
          href="/login?next=/account"
          className="mt-6 inline-block rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Log in / Sign up
        </Link>
      </div>
    );
  }

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const api = async (
    url: string,
    body: unknown,
    okMsg: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: CustomerUser; error?: string };
      if (!res.ok) {
        flash(data.error ?? "Something went wrong.");
        return false;
      }
      if (data.user) saveUser(data.user);
      flash(okMsg);
      return true;
    } catch {
      flash("Network error — please try again.");
      return false;
    }
  };

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none";

  const startEdit = (a: SavedAddress) =>
    setAddrForm({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My account</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {user.name} · {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.replace("/"));
          }}
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Log out
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-neutral-200 p-1">
        {(
          [
            ["orders", "My orders"],
            ["profile", "Profile"],
            ["addresses", "Addresses"],
            ["password", "Password"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toast && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{toast}</p>
      )}

      {/* Orders */}
      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 p-10 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-3 font-semibold">No orders yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Your order history will appear here after your first purchase.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <Link
                key={o.id}
                href={`/track?order=${encodeURIComponent(o.id)}`}
                className="block rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-400"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{o.id}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {o.estimatedDelivery
                        ? ` · arriving by ${new Date(o.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      o.status === "delivered"
                        ? "bg-emerald-50 text-emerald-700"
                        : o.status === "cancelled"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {o.items.map((i, idx) => (
                    <div
                      key={`${o.id}-${idx}`}
                      className="relative h-14 w-12 overflow-hidden rounded-md bg-neutral-100"
                    >
                      <Image src={i.image} alt={i.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ))}
                  {o.itemCount > 4 && (
                    <span className="text-xs text-neutral-500">+{o.itemCount - 4} more</span>
                  )}
                  <span className="ml-auto text-sm font-bold">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))
          )}
          <p className="text-xs text-neutral-400">
            Order placed by guest checkout under your email also shows up on the{" "}
            <Link href="/track" className="underline underline-offset-2">
              track page
            </Link>
            .
          </p>
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Personal information</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-500">Name</label>
              <input
                className={`mt-1 ${input}`}
                defaultValue={user.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">Mobile number</label>
              <input
                className={`mt-1 ${input}`}
                inputMode="numeric"
                defaultValue={user.phone ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-500">Email (used for receipts)</label>
              <input className={`mt-1 ${input}`} value={user.email} disabled />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              void fetch("/api/auth/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: profile.name || user.name, phone: profile.phone || user.phone }),
              }).then(async (res) => {
                const data = (await res.json()) as { user?: CustomerUser; error?: string };
                if (res.ok && data.user) {
                  saveUser(data.user);
                  flash("Profile updated ✓");
                } else {
                  flash(data.error ?? "Could not update profile.");
                }
              })
            }
            className="mt-5 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Save changes
          </button>
        </div>
      )}

      {/* Addresses */}
      {tab === "addresses" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Saved addresses</h2>
            <button
              type="button"
              onClick={() => setAddrForm({ ...EMPTY_FORM })}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              + Add new
            </button>
          </div>

          {addrForm && (
            <div className="rounded-2xl border border-neutral-900 p-5">
              <p className="text-sm font-semibold">
                {addrForm.fullName ? "Edit address" : "New address"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className={input}
                  placeholder="Label (Home / Work)"
                  value={addrForm.label}
                  onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="Full name *"
                  value={addrForm.fullName}
                  onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="Mobile number *"
                  inputMode="numeric"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
                <input
                  className={input}
                  placeholder="Pincode *"
                  inputMode="numeric"
                  value={addrForm.pincode}
                  onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                />
                <input
                  className={`${input} sm:col-span-2`}
                  placeholder="House no, street *"
                  value={addrForm.line1}
                  onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                />
                <input
                  className={`${input} sm:col-span-2`}
                  placeholder="Landmark (optional)"
                  value={addrForm.line2}
                  onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="City *"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="State *"
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await api(
                      "/api/auth/me",
                      { action: "save-address", address: addrForm },
                      "Address saved ✓"
                    );
                    if (ok) setAddrForm(null);
                  }}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
                >
                  Save address
                </button>
                <button
                  type="button"
                  onClick={() => setAddrForm(null)}
                  className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {user.addresses.length === 0 && !addrForm && (
            <p className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-500">
              No saved addresses yet. Add one for one-tap checkout.
            </p>
          )}

          {user.addresses.map((a) => (
            <div key={a.id} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    {a.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {a.fullName} · {a.phone}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="text-xs font-semibold text-neutral-600 underline underline-offset-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void api("/api/auth/me", { action: "delete-address", addressId: a.id }, "Address removed ✓")
                    }
                    className="text-xs font-semibold text-rose-600 underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password */}
      {tab === "password" && (
        <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Change password</h2>
          <div className="mt-4 grid gap-3 sm:max-w-sm">
            <input
              className={input}
              type="password"
              placeholder="Current password *"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              autoComplete="current-password"
            />
            <input
              className={input}
              type="password"
              placeholder="New password (min 6 chars) *"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await api("/api/auth/me", { action: "change-password", ...pw }, "Password changed ✓");
              if (ok) setPw({ current: "", next: "" });
            }}
            className="mt-5 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Update password
          </button>
        </div>
      )}
    </div>
  );
}
