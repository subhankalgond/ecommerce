"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useCustomer } from "@/components/customer-auth-provider";
import { formatPrice } from "@/lib/cart-format";
import { useRazorpay } from "@/components/use-razorpay";

type Provider = "stripe" | "razorpay" | "cod";

interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const ADDRESS_KEY = "nova-threads-address";

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, hydrated, clearCart } = useCart();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<{
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    couponError?: string;
    couponApplied?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{
    stripe: boolean;
    razorpay: boolean;
    cod: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<Provider>("cod");
  const [savedId, setSavedId] = useState<string | null>(null);
  const { openCheckout } = useRazorpay();
  const { user } = useCustomer();

  // Ask the server which payment providers are configured
  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data: { stripe?: boolean; razorpay?: boolean; cod?: boolean }) => {
        const next = {
          stripe: data.stripe === true,
          razorpay: data.razorpay === true,
          cod: data.cod !== false,
        };
        setProviders(next);
        if (next.razorpay) setSelected("razorpay");
        else if (next.stripe) setSelected("stripe");
        else setSelected("cod");
      })
      .catch(() => setProviders({ stripe: false, razorpay: false, cod: true }));
  }, []);

  // Remember the address between visits
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ADDRESS_KEY);
      if (raw) setAddress({ ...EMPTY_ADDRESS, ...(JSON.parse(raw) as Address) });
    } catch {
      // ignore
    }
  }, []);

  // Prefill from the signed-in customer account
  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email);
    if (user.addresses.length > 0) {
      const first = user.addresses[0];
      setSavedId((cur) => cur ?? first.id);
      setAddress((a) =>
        a.fullName || a.line1
          ? a
          : {
              fullName: first.fullName,
              phone: first.phone,
              line1: first.line1,
              line2: first.line2 ?? "",
              city: first.city,
              state: first.state,
              pincode: first.pincode,
            }
      );
    } else {
      setAddress((a) => ({
        ...a,
        fullName: a.fullName || user.name,
        phone: a.phone || (user.phone ?? ""),
      }));
    }
  }, [user]);

  // Server-side quote (coupon + delivery)
  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setQuote(null);
      return;
    }
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        coupon: coupon.trim() || undefined,
        delivery,
      }),
    })
      .then((r) => r.json())
      .then((d) => setQuote(d))
      .catch(() => setQuote(null));
  }, [items, coupon, delivery, hydrated]);

  const effSubtotal = quote?.subtotal ?? subtotal;
  const effShipping = quote?.shipping ?? shipping;
  const effDiscount = quote?.discount ?? 0;
  const effTotal = quote?.total ?? total;

  const addressValid = (): boolean => {
    if (!address.fullName.trim()) {
      setError("Please provide your full legal name for dispatch.");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!address.line1.trim()) {
      setError("Please enter your street address and residence identifier.");
      return false;
    }
    if (!address.city.trim() || !address.state.trim()) {
      setError("Please specify your city and state.");
      return false;
    }
    if (!/^[1-9]\d{5}$/.test(address.pincode.trim())) {
      setError("Please enter a valid 6-digit postal pincode.");
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address for order confirmation & receipt.");
      return;
    }
    if (!addressValid()) return;
    try {
      window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    } catch {
      // ignore
    }

    const payload = {
      email: email.trim(),
      coupon: coupon.trim() || undefined,
      delivery,
      address,
      items: items.map((i) => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity,
      })),
    };

    if (selected === "stripe") {
      await payWithStripe(payload);
    } else if (selected === "razorpay") {
      await payWithRazorpay(payload);
    } else {
      await payWithCod(payload);
    }
  };

  const payWithCod = async (payload: unknown) => {
    setLoading(true);
    try {
      const res = await fetch("/api/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not complete Cash on Delivery booking.");
        setLoading(false);
        return;
      }
      clearCart();
      window.location.assign(
        `/checkout/success?cod=1&order_id=${encodeURIComponent(data.orderId ?? "")}`
      );
    } catch {
      setError("Network interruption — please re-attempt.");
      setLoading(false);
    }
  };

  const payWithStripe = async (payload: unknown) => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to initialize Stripe checkout session.");
        setLoading(false);
        return;
      }
      clearCart();
      window.location.assign(data.url);
    } catch {
      setError("Network error — please check your connectivity.");
      setLoading(false);
    }
  };

  const payWithRazorpay = async (payload: unknown) => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const order = (await res.json()) as {
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        error?: string;
      };
      if (!res.ok || !order.orderId || !order.keyId) {
        setError(order.error ?? "Could not initialize Razorpay gateway session.");
        setLoading(false);
        return;
      }

      await openCheckout({
        orderId: order.orderId,
        amount: order.amount ?? effTotal,
        currency: order.currency ?? "INR",
        keyId: order.keyId,
        email: email.trim(),
        description: "Nova Threads Garment Order",
        onSuccess: (response) => {
          fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })
            .then((v) => v.json())
            .then((v: { ok?: boolean; error?: string; orderId?: string }) => {
              if (!v.ok) {
                setError(
                  v.error ??
                    "Payment signature verification could not be confirmed. If charged, contact support."
                );
                setLoading(false);
                return;
              }
              clearCart();
              window.location.assign(
                `/checkout/success?order_id=${encodeURIComponent(
                  v.orderId ?? ""
                )}&rzp_payment_id=${encodeURIComponent(
                  response.razorpay_payment_id
                )}&rzp_order_id=${encodeURIComponent(
                  response.razorpay_order_id
                )}&rzp_signature=${encodeURIComponent(
                  response.razorpay_signature
                )}`
              );
            })
            .catch(() => {
              setError("Network error while recording payment status.");
              setLoading(false);
            });
        },
        onError: (message) => {
          setError(message === "Payment cancelled." ? null : message);
          setLoading(false);
        },
      });
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  if (!hydrated || items.length === 0) {
    return hydrated && items.length === 0 ? (
      <div className="mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </div>
        <h1 className="mt-4 font-serif text-3xl text-[#171614]">Nothing to Check Out</h1>
        <p className="mt-2 text-xs text-[#6b645b] max-w-xs mx-auto leading-relaxed">
          Your shopping bag contains no garments. Please browse the catalogue before proceeding.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
        >
          Browse Garments
        </Link>
      </div>
    ) : (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-56 animate-pulse bg-[#ede8df]" />
        <div className="mt-8 h-40 animate-pulse bg-[#ede8df]" />
      </div>
    );
  }

  const PROVIDER_INFO: Record<
    Provider,
    { name: string; blurb: string; type: string }
  > = {
    razorpay: {
      name: "Razorpay Gateway",
      blurb: "UPI (Google Pay, PhonePe), Indian Debit/Credit Cards, NetBanking, Wallets",
      type: "India Native",
    },
    stripe: {
      name: "Stripe Checkout",
      blurb: "International & Indian Visa, Mastercard, American Express, Apple Pay",
      type: "Global / Cards",
    },
    cod: {
      name: "Cash on Delivery",
      blurb: "Settle with exact cash upon physical receipt at your doorstep",
      type: "Doorstep Cash",
    },
  };

  const setAddr = (patch: Partial<Address>) => {
    setAddress((a) => ({ ...a, ...patch }));
    setSavedId(null);
    setError(null);
  };

  const inputCls =
    "w-full border border-[#ded7ca] bg-white px-3.5 py-2.5 text-xs text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none transition";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#e5dfd5] pb-6">
        <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
          Step-by-Step Dispatch
        </span>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
          Checkout &amp; Order Placement
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Form (8 Cols) */}
        <div className="space-y-8 lg:col-span-7">
          
          {/* 1. Customer & Delivery Address */}
          <section className="border border-[#e5dfd5] bg-[#faf8f5] p-6">
            <div className="flex items-center justify-between border-b border-[#ede6da] pb-3">
              <h2 className="font-serif text-lg text-[#171614]">
                1. Shipping Address &amp; Contact
              </h2>
              {!user && (
                <Link
                  href="/login?next=/checkout"
                  className="text-xs text-[#8b5a42] hover:underline"
                >
                  Sign in for saved addresses
                </Link>
              )}
            </div>

            {user && user.addresses.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-2">
                  Select From Saved Addresses:
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSavedId(a.id);
                        setAddress({
                          fullName: a.fullName,
                          phone: a.phone,
                          line1: a.line1,
                          line2: a.line2 ?? "",
                          city: a.city,
                          state: a.state,
                          pincode: a.pincode,
                        });
                        setError(null);
                      }}
                      className={`border px-3 py-1.5 text-xs font-medium transition ${
                        savedId === a.id
                          ? "border-[#171614] bg-[#171614] text-white"
                          : "border-[#ded7ca] bg-white text-[#544e45] hover:border-[#171614]"
                      }`}
                    >
                      {a.label} ({a.city})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Full Legal Name *
                </label>
                <input
                  value={address.fullName}
                  onChange={(e) => setAddr({ fullName: e.target.value })}
                  placeholder="Recipient full name"
                  autoComplete="name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Contact Mobile Number *
                </label>
                <input
                  value={address.phone}
                  onChange={(e) => setAddr({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Street Address &amp; Residence *
                </label>
                <input
                  value={address.line1}
                  onChange={(e) => setAddr({ line1: e.target.value })}
                  placeholder="Flat / house number, building, street, area"
                  autoComplete="address-line1"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Landmark (Optional)
                </label>
                <input
                  value={address.line2}
                  onChange={(e) => setAddr({ line2: e.target.value })}
                  placeholder="Nearby landmark or sector notes"
                  autoComplete="address-line2"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  City *
                </label>
                <input
                  value={address.city}
                  onChange={(e) => setAddr({ city: e.target.value })}
                  placeholder="City"
                  autoComplete="address-level2"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  State / Province *
                </label>
                <input
                  value={address.state}
                  onChange={(e) => setAddr({ state: e.target.value })}
                  placeholder="State"
                  autoComplete="address-level1"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Postal Pincode *
                </label>
                <input
                  value={address.pincode}
                  onChange={(e) => setAddr({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="6-digit PIN"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
                  Email For Receipt &amp; Tracking *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@domain.com"
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* 2. Delivery Options */}
          <section className="border border-[#e5dfd5] bg-[#faf8f5] p-6">
            <h2 className="font-serif text-lg text-[#171614] border-b border-[#ede6da] pb-3">
              2. Delivery Method
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "standard" as const,
                    name: "Standard Ground Dispatch",
                    blurb: "3–5 business days transit",
                    price: effShipping === 0 ? "Complimentary" : formatPrice(effShipping),
                  },
                  {
                    id: "express" as const,
                    name: "Priority Air Express",
                    blurb: "1–2 business days priority",
                    price: formatPrice(19900),
                  },
                ]
              ).map((opt) => {
                const active = delivery === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDelivery(opt.id)}
                    aria-pressed={active}
                    className={`border p-4 text-left transition ${
                      active
                        ? "border-[#171614] bg-[#f7f3eb] ring-1 ring-[#171614]"
                        : "border-[#ded7ca] bg-white hover:border-[#171614]"
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#171614]">{opt.name}</p>
                    <p className="mt-1 text-[11px] text-[#736c62]">{opt.blurb}</p>
                    <p className="mt-2 text-xs font-semibold text-[#171614]">{opt.price}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Payment Method */}
          <section className="border border-[#e5dfd5] bg-[#faf8f5] p-6">
            <h2 className="font-serif text-lg text-[#171614] border-b border-[#ede6da] pb-3">
              3. Payment Gateway &amp; Terms
            </h2>

            {providers === null ? (
              <p className="mt-4 text-xs text-[#8c857b]">Detecting payment gateways…</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Object.keys(PROVIDER_INFO) as Provider[])
                  .filter((p) => (providers as Record<string, boolean>)[p])
                  .map((p) => {
                    const info = PROVIDER_INFO[p];
                    const active = selected === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelected(p)}
                        aria-pressed={active}
                        className={`border p-4 text-left transition ${
                          active
                            ? "border-[#171614] bg-[#f7f3eb] ring-1 ring-[#171614]"
                            : "border-[#ded7ca] bg-white hover:border-[#171614]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#171614]">{info.name}</p>
                          <span className="text-[10px] uppercase tracking-wider text-[#8b5a42]">
                            {info.type}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#6b645b] leading-relaxed">
                          {info.blurb}
                        </p>
                      </button>
                    );
                  })}
              </div>
            )}

            {error && (
              <div className="mt-4 border border-[#8b5a42] bg-[#fcf9f7] p-3 text-xs text-[#8b5a42]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading || providers === null}
              className="mt-6 w-full border border-[#171614] bg-[#171614] py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition disabled:opacity-40"
            >
              {loading
                ? "Processing Secure Transaction…"
                : selected === "cod"
                  ? `Place Order · Pay ${formatPrice(effTotal)} on Delivery`
                  : `Complete Order with ${selected === "stripe" ? "Stripe" : "Razorpay"} · ${formatPrice(effTotal)}`}
            </button>

            <p className="mt-3 text-center text-[10px] text-[#8c857b]">
              {selected === "stripe"
                ? "Stripe test sandbox enabled. Server verifies session before order completion."
                : selected === "razorpay"
                  ? "Razorpay test mode enabled. HMAC-SHA256 signature verified server-side."
                  : "Cash on delivery: Please keep exact amount available for courier delivery agent."}
            </p>
          </section>

        </div>

        {/* Right Summary (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 border border-[#ded7ca] bg-[#f7f4ee] p-6 space-y-6">
            <h2 className="font-serif text-lg text-[#171614] border-b border-[#e2dcd2] pb-3">
              Order Review ({items.length} {items.length === 1 ? "Item" : "Items"})
            </h2>

            {/* Garment Lines */}
            <ul className="divide-y divide-[#ede6da] max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-4 py-3">
                  <div className="relative aspect-[3/4] h-16 w-12 shrink-0 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-xs text-[#171614]">{item.name}</p>
                    <p className="text-[11px] text-[#736c62]">
                      Size: {item.size} · Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#171614]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon Code Input */}
            <div className="border-t border-[#e2dcd2] pt-4">
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1.5">
                Have a Promotional Code?
              </label>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="WELCOME10 / FLAT200"
                  className="flex-1 border border-[#ded7ca] bg-white px-3 py-1.5 text-xs uppercase text-[#171614] focus:border-[#171614] focus:outline-none"
                />
              </div>
              {quote?.couponApplied && (
                <p className="mt-1.5 text-[11px] text-[#515c4d] font-medium">
                  ✓ Code {quote.couponApplied} applied
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <dl className="space-y-2 border-t border-[#e2dcd2] pt-4 text-xs">
              <div className="flex justify-between text-[#615a51]">
                <dt>Subtotal</dt>
                <dd>{formatPrice(effSubtotal)}</dd>
              </div>

              {effDiscount > 0 && (
                <div className="flex justify-between text-[#8b5a42] font-medium">
                  <dt>Promotional Savings</dt>
                  <dd>−{formatPrice(effDiscount)}</dd>
                </div>
              )}

              <div className="flex justify-between text-[#615a51]">
                <dt>Shipping ({delivery === "express" ? "Express" : "Standard"})</dt>
                <dd>
                  {effShipping === 0 ? (
                    <span className="text-[#515c4d] font-medium">Complimentary</span>
                  ) : (
                    formatPrice(effShipping)
                  )}
                </dd>
              </div>

              <div className="flex justify-between border-t border-[#ded7ca] pt-3 text-base font-serif font-medium text-[#171614]">
                <dt>Final Payable</dt>
                <dd>{formatPrice(effTotal)}</dd>
              </div>
            </dl>

            <div className="border-t border-[#e2dcd2] pt-4">
              <Link
                href="/cart"
                className="text-xs text-[#736c62] hover:text-[#171614] transition underline underline-offset-2"
              >
                ← Edit items in shopping bag
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
