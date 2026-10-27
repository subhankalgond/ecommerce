"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/cart-format";
import type { CartItem } from "@/components/cart-provider";

const SAVED_KEY = "nova-threads-saved-for-later";

interface Quote {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponError?: string;
  couponApplied?: string | null;
}

export default function CartPage() {
  const {
    items,
    subtotal,
    shipping,
    total,
    hydrated,
    updateQuantity,
    removeItem,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<CartItem[]>([]);

  // Load saved-for-later
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore
    }
  }, []);

  const persistSaved = (list: CartItem[]) => {
    setSaved(list);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const saveForLater = (item: CartItem) => {
    persistSaved([
      ...saved.filter((s) => s.key !== item.key),
      item,
    ]);
    removeItem(item.key);
  };

  const moveToCart = (item: CartItem) => {
    persistSaved(saved.filter((s) => s.key !== item.key));
    try {
      const raw = window.localStorage.getItem("nova-threads-cart-v1");
      const cart = raw ? (JSON.parse(raw) as CartItem[]) : [];
      if (!cart.some((c) => c.key === item.key)) {
        cart.push(item);
        window.localStorage.setItem("nova-threads-cart-v1", JSON.stringify(cart));
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  // Fetch real-time server quote
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
      }),
    })
      .then((r) => r.json())
      .then((d: Quote) => {
        setQuote(d);
        if (d.couponError) {
          setCouponMsg(d.couponError);
        } else if (d.discount > 0) {
          setCouponMsg(`Coupon ${d.couponApplied} applied — savings of ${formatPrice(d.discount)}`);
        } else {
          setCouponMsg(null);
        }
      })
      .catch(() => setQuote(null));
  }, [items, coupon, hydrated]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse bg-[#ede8df]" />
        <div className="mt-8 h-40 animate-pulse bg-[#ede8df]" />
      </div>
    );
  }

  const effSubtotal = quote?.subtotal ?? subtotal;
  const effShipping = quote?.shipping ?? shipping;
  const effDiscount = quote?.discount ?? 0;
  const effTotal = quote?.total ?? total;

  if (items.length === 0 && saved.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </div>
        <h1 className="mt-4 font-serif text-3xl text-[#171614]">Your Shopping Bag is Empty</h1>
        <p className="mt-2 text-xs text-[#6b645b] max-w-sm mx-auto leading-relaxed">
          Explore our seasonal edits and permanent collection to select thoughtfully crafted essentials.
        </p>
        <div className="mt-6">
          <Link
            href="/products"
            className="inline-block border border-[#171614] bg-[#171614] px-8 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-[#e5dfd5] pb-6">
        <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
          Review &amp; Summary
        </span>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
          Shopping Bag
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left: Bag Items */}
        <div className="lg:col-span-8">
          {items.length > 0 ? (
            <div className="divide-y divide-[#ede6da] border-b border-[#ede6da]">
              {items.map((item) => (
                <div key={item.key} className="flex gap-6 py-6">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative aspect-[3/4] h-32 w-24 shrink-0 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-serif text-base text-[#171614] hover:text-[#8b5a42] transition"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-xs text-[#736c62]">
                            Selected Size: <strong className="font-medium text-[#171614]">{item.size}</strong>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#171614]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#ede6da] pt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#ded7ca] bg-white text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="px-2.5 py-1 text-[#615a51] hover:text-[#171614]"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-[#171614]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2.5 py-1 text-[#615a51] hover:text-[#171614]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <button
                          type="button"
                          onClick={() => saveForLater(item)}
                          className="text-[#615a51] hover:text-[#171614] transition underline underline-offset-2"
                        >
                          Save for later
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-[#8b5a42] hover:text-[#6f4430] transition underline underline-offset-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-xs text-[#736c62]">
              No active items in your bag.
            </p>
          )}

          {/* Saved for Later Section */}
          {saved.length > 0 && (
            <div className="mt-14 border-t border-[#e5dfd5] pt-8">
              <h2 className="font-serif text-xl text-[#171614]">
                Saved For Later ({saved.length})
              </h2>
              <div className="mt-6 divide-y divide-[#ede6da]">
                {saved.map((item) => (
                  <div key={item.key} className="flex items-center gap-6 py-4">
                    <div className="relative aspect-[3/4] h-20 w-16 shrink-0 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xs text-[#171614]">{item.name}</p>
                      <p className="text-[11px] text-[#736c62]">Size: {item.size} · {formatPrice(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      className="border border-[#171614] bg-white px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:bg-[#171614] hover:text-white transition"
                    >
                      Move to Bag
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary & Coupon */}
        <div className="lg:col-span-4">
          <div className="border border-[#ded7ca] bg-[#f7f4ee] p-6 space-y-6">
            <h2 className="font-serif text-lg text-[#171614] border-b border-[#e2dcd2] pb-3">
              Order Summary
            </h2>

            {/* Coupon Application */}
            <div>
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1.5">
                Promotional Code
              </label>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="WELCOME10 / FLAT200"
                  className="flex-1 border border-[#ded7ca] bg-white px-3 py-2 text-xs uppercase text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none"
                />
              </div>
              {couponMsg && (
                <p className={`mt-2 text-xs font-medium ${quote?.discount ? "text-[#515c4d]" : "text-[#8b5a42]"}`}>
                  {couponMsg}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <dl className="space-y-2.5 text-xs border-t border-[#e2dcd2] pt-4">
              <div className="flex justify-between text-[#615a51]">
                <dt>Garment Subtotal</dt>
                <dd>{formatPrice(effSubtotal)}</dd>
              </div>

              {effDiscount > 0 && (
                <div className="flex justify-between text-[#8b5a42] font-medium">
                  <dt>Promotional Discount</dt>
                  <dd>−{formatPrice(effDiscount)}</dd>
                </div>
              )}

              <div className="flex justify-between text-[#615a51]">
                <dt>Domestic Shipping</dt>
                <dd>
                  {effShipping === 0 ? (
                    <span className="text-[#515c4d] font-medium">Complimentary</span>
                  ) : (
                    formatPrice(effShipping)
                  )}
                </dd>
              </div>

              <div className="flex justify-between border-t border-[#ded7ca] pt-3 text-base font-serif font-medium text-[#171614]">
                <dt>Estimated Total</dt>
                <dd>{formatPrice(effTotal)}</dd>
              </div>
            </dl>

            <div className="pt-2 space-y-3">
              <Link
                href="/checkout"
                className="block w-full border border-[#171614] bg-[#171614] py-3 text-center text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/products"
                className="block text-center text-xs text-[#736c62] hover:text-[#171614] transition"
              >
                ← Continue Browsing Catalogue
              </Link>
            </div>

            <div className="border-t border-[#e2dcd2] pt-4 text-[10px] text-[#8c857b] space-y-1">
              <p>• Verified checkout via Razorpay &amp; Stripe</p>
              <p>• UPI, NetBanking, Credit/Debit cards &amp; COD accepted</p>
              <p>• Free shipping automatically applies on orders over ₹999</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
