"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/cart-format";

export default function CartDrawer() {
  const {
    items,
    subtotal,
    shipping,
    total,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    count,
  } = useCart();

  if (!isOpen) return null;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-black/40"
      />
      {/* Panel */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p className="text-base font-semibold">Your cart {count > 0 && `(${count})`}</p>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-4xl">🛍️</p>
            <p className="font-medium text-neutral-900">Your cart is empty</p>
            <p className="text-sm text-neutral-500">Add something you love to get started.</p>
            <Link
              href="/products"
              onClick={closeCart}
              className="mt-2 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="border-b border-neutral-200 px-5 py-3">
              {remaining > 0 ? (
                <p className="text-xs text-neutral-600">
                  Add{" "}
                  <span className="font-semibold text-neutral-900">
                    {formatPrice(remaining)}
                  </span>{" "}
                  more for free shipping
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-600">
                  🎉 You&apos;ve unlocked free shipping!
                </p>
              )}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100"
                  >
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="shrink-0 text-neutral-400 transition hover:text-rose-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">Size: {item.size}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-neutral-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="px-2.5 py-1 text-sm text-neutral-600 hover:text-neutral-900"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2.5 py-1 text-sm text-neutral-600 hover:text-neutral-900"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="space-y-2 border-t border-neutral-200 px-5 py-4">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Subtotal</span>
                <span className="text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Shipping</span>
                <span className="text-neutral-900">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link
                href="/cart"
                onClick={closeCart}
                className="block rounded-full border border-neutral-300 py-2.5 text-center text-sm font-medium transition hover:bg-neutral-50"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block rounded-full bg-neutral-900 py-2.5 text-center text-sm font-medium text-white transition hover:bg-neutral-700"
              >
                Checkout · {formatPrice(total)}
              </Link>
              <p className="pt-1 text-center text-[11px] leading-relaxed text-neutral-400">
                Free shipping over {formatPrice(FREE_SHIPPING_THRESHOLD)} · otherwise{" "}
                {formatPrice(SHIPPING_FEE)}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
