"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomer, type CustomerUser } from "@/components/customer-auth-provider";
import { formatPrice } from "@/lib/cart-format";
import type { SavedAddress } from "@/lib/order-types";

const STATUS_LABEL: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
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
  const { user, orders, loading, logout, saveUser } = useCustomer();
  const router = useRouter();

  const [tab, setTab] = useState<"orders" | "profile" | "addresses" | "password">("orders");
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [addrForm, setAddrForm] = useState<AddressForm | null>(null);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-56 animate-pulse bg-[#ede8df]" />
        <div className="mt-8 h-40 animate-pulse bg-[#ede8df]" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login?next=/account");
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
          </svg>
        </div>
        <h1 className="mt-4 font-serif text-2xl text-[#171614]">Client Session Inactive</h1>
        <p className="mt-2 text-xs text-[#6b645b]">Please sign in to inspect your order history and addresses.</p>
        <Link
          href="/login?next=/account"
          className="mt-6 inline-block border border-[#171614] bg-[#171614] px-8 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
        >
          Sign In
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
        flash(data.error ?? "Failed to save updates.");
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

  const inputCls =
    "w-full border border-[#ded7ca] bg-white px-3.5 py-2 text-xs text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none transition";

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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Account Header */}
      <div className="border-b border-[#e5dfd5] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Client Portal
          </span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
            {user.name}
          </h1>
          <p className="mt-1 text-xs text-[#6b645b]">
            {user.email} · Registered Client Profile
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.replace("/"));
          }}
          className="border border-[#ded7ca] bg-white px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:border-[#171614] transition"
        >
          Sign Out
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex gap-2 border-b border-[#e5dfd5] pb-px overflow-x-auto">
        {(
          [
            ["orders", "My Orders"],
            ["profile", "Profile Information"],
            ["addresses", "Saved Addresses"],
            ["password", "Security & Password"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase transition ${
              tab === id
                ? "border-[#171614] text-[#171614]"
                : "border-transparent text-[#7a7368] hover:text-[#171614]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="mt-4 border border-[#515c4d] bg-[#f5f8f5] px-4 py-2 text-xs text-[#384035] font-medium">
          {toast}
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <div className="border border-[#ded7ca] bg-[#faf8f5] p-12 text-center">
              <p className="font-serif text-lg text-[#171614]">No Prior Orders</p>
              <p className="mt-2 text-xs text-[#6b645b] max-w-sm mx-auto leading-relaxed">
                When you make an order with your account, item manifests and real-time status milestones will appear here.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-block border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
              >
                Browse Catalogue
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="border border-[#ded7ca] bg-[#faf8f5] p-6 transition hover:border-[#171614]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ede6da] pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#171614]">{o.id}</span>
                    <span className="mx-2 text-[#b0a99f]">·</span>
                    <span className="text-[11px] text-[#736c62]">
                      Placed on {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <span
                    className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      o.status === "delivered"
                        ? "border-[#515c4d] bg-[#f5f8f5] text-[#384035]"
                        : o.status === "cancelled"
                          ? "border-[#8b5a42] bg-[#fcf9f7] text-[#8b5a42]"
                          : "border-[#b8956e] bg-[#fbf8f3] text-[#7b542c]"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {o.items.map((i, idx) => (
                      <div
                        key={`${o.id}-${idx}`}
                        className="relative aspect-[3/4] h-16 w-12 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]"
                      >
                        <Image src={i.image} alt={i.name} fill sizes="48px" className="object-cover" />
                      </div>
                    ))}
                    {o.itemCount > 4 && (
                      <span className="text-xs text-[#736c62]">+{o.itemCount - 4} more</span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#736c62]">Total Amount</p>
                    <p className="text-sm font-semibold text-[#171614]">{formatPrice(o.total)}</p>
                    <Link
                      href={`/track?order=${encodeURIComponent(o.id)}`}
                      className="mt-2 inline-block text-xs font-semibold text-[#8b5a42] hover:underline"
                    >
                      Track Order Progress →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="mt-8 border border-[#ded7ca] bg-[#faf8f5] p-6 max-w-xl">
          <h2 className="font-serif text-lg text-[#171614] border-b border-[#ede6da] pb-3">
            Profile Details
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Full Name
              </label>
              <input
                className={inputCls}
                defaultValue={user.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Contact Phone
              </label>
              <input
                className={inputCls}
                inputMode="numeric"
                defaultValue={user.phone ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Email Address (Permanent Account Identifier)
              </label>
              <input className={`${inputCls} bg-[#f5f0e8] text-[#736c62] cursor-not-allowed`} value={user.email} disabled />
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
                  flash("Profile successfully updated.");
                } else {
                  flash(data.error ?? "Failed to update profile.");
                }
              })
            }
            className="mt-6 border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
          >
            Save Profile Changes
          </button>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === "addresses" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#171614]">Saved Postal Addresses</h2>
            <button
              type="button"
              onClick={() => setAddrForm({ ...EMPTY_FORM })}
              className="border border-[#171614] bg-[#171614] px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
            >
              + Add New Address
            </button>
          </div>

          {addrForm && (
            <div className="border border-[#171614] bg-[#faf8f5] p-6 shadow-sm">
              <p className="font-serif text-base text-[#171614]">
                {addrForm.fullName ? "Edit Delivery Address" : "New Delivery Address"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className={inputCls}
                  placeholder="Label (e.g. Home, Studio, Office)"
                  value={addrForm.label}
                  onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Recipient Full Name *"
                  value={addrForm.fullName}
                  onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Contact Mobile Number *"
                  inputMode="numeric"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
                <input
                  className={inputCls}
                  placeholder="Postal Pincode *"
                  inputMode="numeric"
                  value={addrForm.pincode}
                  onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                />
                <input
                  className={`${inputCls} sm:col-span-2`}
                  placeholder="House / Flat No, Building, Street *"
                  value={addrForm.line1}
                  onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                />
                <input
                  className={`${inputCls} sm:col-span-2`}
                  placeholder="Landmark (optional)"
                  value={addrForm.line2}
                  onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="City *"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="State *"
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await api(
                      "/api/auth/me",
                      { action: "save-address", address: addrForm },
                      "Address recorded successfully."
                    );
                    if (ok) setAddrForm(null);
                  }}
                  className="border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setAddrForm(null)}
                  className="border border-[#ded7ca] bg-white px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-[#615a51] hover:border-[#171614] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {user.addresses.length === 0 && !addrForm && (
            <p className="border border-[#ded7ca] bg-[#faf8f5] p-8 text-xs text-[#6b645b]">
              No saved addresses recorded yet. Add your standard residence for single-click checkout.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {user.addresses.map((a) => (
              <div key={a.id} className="border border-[#ded7ca] bg-[#faf8f5] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8b5a42]">
                      {a.label}
                    </span>
                    <p className="mt-1 font-serif text-sm text-[#171614]">
                      {a.fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-[#736c62]">{a.phone}</p>
                    <p className="mt-2 text-xs text-[#544e45] leading-relaxed">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="text-xs text-[#171614] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void api("/api/auth/me", { action: "delete-address", addressId: a.id }, "Address removed.")
                      }
                      className="text-xs text-[#8b5a42] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="mt-8 border border-[#ded7ca] bg-[#faf8f5] p-6 max-w-md">
          <h2 className="font-serif text-lg text-[#171614] border-b border-[#ede6da] pb-3">
            Change Account Password
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                Current Password *
              </label>
              <input
                className={inputCls}
                type="password"
                placeholder="Current password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                New Password (minimum 6 characters) *
              </label>
              <input
                className={inputCls}
                type="password"
                placeholder="New password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                autoComplete="new-password"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await api("/api/auth/me", { action: "change-password", ...pw }, "Password updated successfully.");
              if (ok) setPw({ current: "", next: "" });
            }}
            className="mt-6 border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
          >
            Update Password
          </button>
        </div>
      )}

    </div>
  );
}
