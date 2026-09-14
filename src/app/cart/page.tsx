"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import {
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from "@/lib/cart-format";
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
    count,
    hydrated,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<CartItem[]>([]);

  // load saved-for-later
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
    // re-add via a synthetic add through quantity update is not possible
    // without the product object; simplest is a page-level fetch-free hack:
    // we re-insert into localStorage cart on next render using updateQuantity.
    // Instead we use the public cart payload API: add via checkout flow.
    persistSaved(saved.filter((s) => s.key !== item.key));
    // Add through the drawer provider by dispatching a custom event the
    // cart-provider listens to (keeps single source of truth).
    window.dispatchEvent(
      new CustomEvent("nova:add-item", { detail: item })
    );
  };

  // Ask the server for a quote whenever cart or coupon changes
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
        setCouponMsg(d.couponError ?? (d.discount > 0 ? `Coupon ${d.couponApplied} applied — you save ${formatPrice(d.discount)}` : null));
      })
      .catch(() => setQuote(null));
  }, [items, coupon, hydrated]);

  // listen for re-adds from saved list
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as CartItem;
      if (!detail) return;
      // put the item back through localStorage merge
      try {
        const raw = window.localStorage.getItem("nova-threads-cart-v1");
        const cart = raw ? (JSON.parse(raw) as CartItem[]) : [];
        if (!cart.some((c) => c.key === detail.key)) {
          cart.push(detail);
          window.localStorage.setItem("nova-threads-cart-v1", JSON.stringify(cart));
          window.location.reload();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("nova:add-item", handler);
    return () => window.removeEventListener("nova:add-item", handler);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 h-32 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/products"
            className="mt-6 rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Start shopping
          </Link>
          {saved.length > 0 && (
            <div className="mt-10 w-full text-left">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Saved for later ({saved.length})
              </h2>
              <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
                {saved.map((item) => (
                  <li key={item.key} className="flex items-center gap-4 py-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-neutral-500">Size {item.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-100"
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => persistSaved(saved.filter((s) => s.key !== item.key))}
                      className="text-xs text-neutral-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const effSubtotal = quote?.subtotal ?? subtotal;
  const effShipping = quote?.shipping ?? shipping;
  const effDiscount = quote?.discount ?? 0;
  const effTotal = quote?.total ?? total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {count} {count === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          {remaining > 0 && quote?.discount === 0 && (
            <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add{" "}
              <span className="font-semibold">{formatPrice(remaining)}</span> more
              to get free shipping (otherwise {formatPrice(SHIPPING_FEE)}).
            </p>
          )}
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 py-5">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="truncate font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-neutral-500">
                        Size: {item.size} · {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => saveForLater(item)}
                        className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                      >
                        Save for later
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-sm text-neutral-400 underline-offset-2 hover:text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearCart}
            className="mt-4 text-sm text-neutral-500 underline-offset-2 hover:text-rose-600 hover:underline"
          >
            Clear cart
          </button>

          {saved.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Saved for later ({saved.length})
              </h2>
              <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
                {saved.map((item) => (
                  <li key={item.key} className="flex items-center gap-4 py-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-neutral-500">Size {item.size} · {formatPrice(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-100"
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => persistSaved(saved.filter((s) => s.key !== item.key))}
                      className="text-xs text-neutral-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>

          {/* Coupon */}
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCouponMsg(null)}
                className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`mt-2 text-xs ${effDiscount > 0 || !couponMsg.includes("Invalid") ? "text-emerald-600" : "text-rose-600"}`}>
                {couponMsg}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-neutral-400">
              Try <span className="font-mono font-semibold">WELCOME10</span> ·{" "}
              <span className="font-mono font-semibold">FLAT200</span>
            </p>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium">{formatPrice(effSubtotal)}</dd>
            </div>
            {effDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Coupon discount</dt>
                <dd className="font-medium">−{formatPrice(effDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium">
                {effShipping === 0 ? "Free" : formatPrice(effShipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{formatPrice(effTotal)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-neutral-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm text-neutral-600 underline-offset-4 hover:underline"
          >
            Continue shopping
          </Link>
          <p className="mt-4 text-center text-xs text-neutral-400">
            Taxes included · Secure payment
          </p>
        </aside>
      </div>
    </div>
  );
}
