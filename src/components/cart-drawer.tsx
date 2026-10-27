"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
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

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-in Panel */}
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#e5dfd5] bg-[#faf8f5] shadow-2xl">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#e5dfd5] px-6 py-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-lg tracking-wider uppercase text-[#171614]">
              Shopping Bag
            </h2>
            {count > 0 && (
              <span className="text-xs text-[#8c857b]">({count} {count === 1 ? "item" : "items"})</span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-1 text-[#615a51] hover:text-[#171614] transition"
            aria-label="Close bag"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
            <p className="font-serif text-lg text-[#171614]">Your Bag is Empty</p>
            <p className="text-xs text-[#6b645b] max-w-xs leading-relaxed">
              Discover timeless essentials crafted with disciplined silhouettes and natural fibres.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="mt-4 border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <div className="border-b border-[#e5dfd5] bg-[#f5f0e8] px-6 py-3">
              {remaining > 0 ? (
                <p className="text-[11px] text-[#615a51]">
                  Add <strong className="font-semibold text-[#171614]">{formatPrice(remaining)}</strong> more for complimentary delivery.
                </p>
              ) : (
                <p className="text-[11px] font-medium text-[#515c4d]">
                  ✓ Unlocked complimentary domestic delivery
                </p>
              )}
              <div className="mt-2 h-1 w-full overflow-hidden bg-[#ded8cc]">
                <div
                  className="h-full bg-[#171614] transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Bag Items List */}
            <ul className="flex-1 divide-y divide-[#ede6da] overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative aspect-[3/4] h-24 w-18 shrink-0 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="font-serif text-xs font-normal text-[#171614] hover:text-[#8b5a42] transition"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-[#9c958a] hover:text-[#8b5a42] transition p-0.5"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#7a7368]">Size: {item.size}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#ded7ca] bg-white text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="px-2 py-1 text-[#615a51] hover:text-[#171614]"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-[#171614]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2 py-1 text-[#615a51] hover:text-[#171614]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-[#171614]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Bottom Checkout Actions */}
            <div className="border-t border-[#e5dfd5] bg-[#f5f0e8] p-6 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#615a51]">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#615a51]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-[#ded8cc] pt-2 text-sm font-semibold text-[#171614]">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full border border-[#171614] bg-[#171614] py-3 text-center text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full border border-[#ded7ca] bg-white py-2 text-center text-xs font-semibold tracking-wider uppercase text-[#544e45] hover:border-[#171614] hover:text-[#171614] transition"
                >
                  View Full Bag &amp; Apply Coupon
                </Link>
              </div>

              <p className="text-center text-[10px] text-[#8c857b] pt-1">
                Taxes calculated at checkout · Secure 256-bit encryption
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
