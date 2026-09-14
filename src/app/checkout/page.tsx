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

  // Prefill from the signed-in customer account (Flipkart-style)
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
    if (!address.fullName.trim()) { setError("Please enter your full name."); return false; }
    if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))) { setError("Enter a valid 10-digit mobile number."); return false; }
    if (!address.line1.trim()) { setError("Please enter your address (house no, street)."); return false; }
    if (!address.city.trim() || !address.state.trim()) { setError("Please enter your city and state."); return false; }
    if (!/^[1-9]\d{5}$/.test(address.pincode.trim())) { setError("Enter a valid 6-digit pincode."); return false; }
    return true;
  };

  const handlePay = async () => {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email for your receipt.");
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
        setError(data.error ?? "Could not place the order.");
        setLoading(false);
        return;
      }
      clearCart();
      window.location.assign(
        `/checkout/success?cod=1&order_id=${encodeURIComponent(data.orderId ?? "")}`
      );
    } catch {
      setError("Network error — please try again.");
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
        setError(data.error ?? "Something went wrong starting checkout.");
        setLoading(false);
        return;
      }
      // Clear the local cart only after Stripe's page has taken over the order
      clearCart();
      window.location.assign(data.url);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  const payWithRazorpay = async (payload: unknown) => {
    setLoading(true);
    try {
      // 1. Create the order server-side
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
        setError(order.error ?? "Could not start Razorpay checkout.");
        setLoading(false);
        return;
      }

      // 2. Open the Razorpay modal
      await openCheckout({
        orderId: order.orderId,
        amount: order.amount ?? effTotal,
        currency: order.currency ?? "INR",
        keyId: order.keyId,
        email: email.trim(),
        description: "Nova Threads order",
        onSuccess: (response) => {
          // 3. Verify the signature server-side before confirming
          fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })
            .then((v) => v.json())
            .then((v: { ok?: boolean; error?: string }) => {
              if (!v.ok) {
                setError(
                  v.error ??
                    "We could not verify your payment. If you were charged, contact support."
                );
                setLoading(false);
                return;
              }
              clearCart();
              window.location.assign(
                `/checkout/success?rzp_payment_id=${encodeURIComponent(
                  response.razorpay_payment_id
                )}&rzp_order_id=${encodeURIComponent(response.razorpay_order_id)}`
              );
            })
            .catch(() => {
              setError("Network error while verifying your payment.");
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
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="text-5xl">🧾</p>
        <h1 className="mt-4 text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your cart is empty — add a few items first.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Browse products
        </Link>
      </div>
    ) : (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  const PROVIDER_INFO: Record<
    Provider,
    { name: string; blurb: string; badge: string }
  > = {
    stripe: {
      name: "Stripe",
      blurb: "International cards, Apple Pay & more",
      badge: "💳",
    },
    razorpay: {
      name: "Razorpay",
      blurb: "UPI, cards, netbanking & wallets (India)",
      badge: "🇮🇳",
    },
    cod: {
      name: "Cash on Delivery",
      blurb: "Pay in cash when your order arrives",
      badge: "💵",
    },
  };

  const setAddr = (patch: Partial<Address>) => {
    setAddress((a) => ({ ...a, ...patch }));
    setSavedId(null);
    setError(null);
  };

  const inputCls =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Address → Delivery → Payment → Place order.
      </p>

      {/* 1. Delivery address */}
      <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">1 · Delivery address</h2>
        {user && user.addresses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
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
                aria-pressed={savedId === a.id}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  savedId === a.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                }`}
              >
                📍 {a.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={address.fullName}
            onChange={(e) => setAddr({ fullName: e.target.value })}
            placeholder="Full name *"
            autoComplete="name"
            className={inputCls}
          />
          <input
            value={address.phone}
            onChange={(e) => setAddr({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            placeholder="Mobile number *"
            inputMode="numeric"
            autoComplete="tel"
            className={inputCls}
          />
          <input
            value={address.line1}
            onChange={(e) => setAddr({ line1: e.target.value })}
            placeholder="House no, street *"
            autoComplete="address-line1"
            className={`${inputCls} sm:col-span-2`}
          />
          <input
            value={address.line2}
            onChange={(e) => setAddr({ line2: e.target.value })}
            placeholder="Landmark (optional)"
            autoComplete="address-line2"
            className={`${inputCls} sm:col-span-2`}
          />
          <input
            value={address.city}
            onChange={(e) => setAddr({ city: e.target.value })}
            placeholder="City *"
            autoComplete="address-level2"
            className={inputCls}
          />
          <input
            value={address.state}
            onChange={(e) => setAddr({ state: e.target.value })}
            placeholder="State *"
            autoComplete="address-level1"
            className={inputCls}
          />
          <input
            value={address.pincode}
            onChange={(e) => setAddr({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="Pincode *"
            inputMode="numeric"
            autoComplete="postal-code"
            className={inputCls}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-900">
            Email for your receipt
          </label>
          {!user && (
            <Link
              href="/login?next=/checkout"
              className="text-xs font-semibold text-neutral-900 underline underline-offset-2"
            >
              Log in for faster checkout
            </Link>
          )}
        </div>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className={`mt-2 ${inputCls}`}
        />
      </div>

      {/* 2. Delivery option */}
      <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">2 · Delivery option</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "standard" as const,
                name: "Standard delivery",
                blurb: "3–5 business days",
                price: effShipping === 0 ? "Free" : formatPrice(effShipping),
              },
              {
                id: "express" as const,
                name: "Express delivery",
                blurb: "1–2 business days",
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
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <p className="text-sm font-semibold">{opt.name}</p>
                <p className="mt-1 text-xs text-neutral-500">{opt.blurb}</p>
                <p className="mt-2 text-sm font-bold">{opt.price}</p>
              </button>
            );
          })}
        </div>
        {delivery === "standard" && effShipping === 0 && (
          <p className="mt-3 text-xs text-emerald-600">
            🎉 Your order qualifies for free standard shipping.
          </p>
        )}
      </div>

      {/* 3. Payment method */}
      <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">3 · Payment method</h2>
        {providers === null ? (
          <p className="mt-3 text-sm text-neutral-400">Checking available options…</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {info.badge} {info.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{info.blurb}</p>
                  </button>
                );
              })}
            {!providers.stripe && !providers.razorpay && (
              <p className="text-xs text-neutral-400 sm:col-span-2">
                Online payments need API keys in <code className="font-mono">.env</code> — see README.md. Cash on Delivery works right away.
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || providers === null}
          className="mt-5 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Placing order…"
            : selected === "cod"
              ? `Place order · Pay ${formatPrice(effTotal)} on delivery`
              : `Pay ${formatPrice(effTotal)} with ${
                  selected === "stripe" ? "Stripe" : "Razorpay"
                }`}
        </button>
        <p className="mt-3 text-center text-xs text-neutral-400">
          {selected === "stripe"
            ? "Stripe test mode: card 4242 4242 4242 4242, any future date, any CVC."
            : selected === "razorpay"
              ? "Razorpay test mode: use the test cards / UPI IDs shown in the Razorpay modal."
              : "Please keep exact change ready. COD is limited to ₹50,000 per order."}
        </p>
        <Link
          href="/cart"
          className="mt-4 block text-center text-sm text-neutral-600 underline-offset-4 hover:underline"
        >
          ← Back to cart
        </Link>
      </div>

      {/* 4. Order summary */}
      <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">4 · Order summary</h2>
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-neutral-500">
                  Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Coupon */}
        <div className="mt-5 flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-neutral-900 focus:outline-none"
          />
          <span className="flex items-center text-xs text-neutral-400">auto-applied</span>
        </div>

        <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd>{formatPrice(effSubtotal)}</dd>
          </div>
          {effDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>Coupon {quote?.couponApplied}</dt>
              <dd>−{formatPrice(effDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-600">
              Shipping {delivery === "express" && "(express)"}
            </dt>
            <dd>{effShipping === 0 ? "Free" : formatPrice(effShipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(effTotal)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
