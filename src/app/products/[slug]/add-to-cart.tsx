"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";

export default function AddToCart({
  product,
  inStock = true,
}: {
  product: Product;
  inStock?: boolean;
}) {
  const { addItem, closeCart } = useCart();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string>(product.colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const requireSize = (): string | null => {
    if (!size) {
      setError("Please select a size first.");
      return null;
    }
    setError(null);
    return size;
  };

  const handleAdd = () => {
    const s = requireSize();
    if (s) addItem(product, s, quantity);
  };

  const handleBuyNow = () => {
    const s = requireSize();
    if (!s) return;
    setBuying(true);
    closeCart();
    addItem(product, s, quantity);
    // addItem opens the cart drawer — go straight to checkout instead
    router.push("/checkout");
  };

  const wishlisted = has(product.id);

  return (
    <div>
      {/* Colours */}
      {product.colors.length > 1 && (
        <div className="mb-5">
          <p className="text-sm font-semibold">Colour</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  color === c
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            Selected: <span className="font-medium text-neutral-600">{color}</span>
          </p>
        </div>
      )}

      {/* Sizes */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Select size</p>
        <button
          type="button"
          className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
          onClick={() => alert("Size guide coming soon — for the demo, order your usual size.")}
        >
          Size guide
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSize(s);
              setError(null);
            }}
            aria-pressed={size === s}
            className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              size === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {/* Quantity + actions */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-neutral-300">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2.5 text-neutral-600 hover:text-neutral-900"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="px-3.5 py-2.5 text-neutral-600 hover:text-neutral-900"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="flex-1 rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {inStock ? "Add to cart" : "Out of stock"}
        </button>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg transition ${
            wishlisted
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-neutral-300 text-neutral-500 hover:border-rose-400 hover:text-rose-600"
          }`}
        >
          {wishlisted ? "❤" : "♡"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock || buying}
        className="mt-3 w-full rounded-full border-2 border-neutral-900 bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-50"
      >
        {buying ? "Going to checkout…" : "Buy now"}
      </button>

      {/* Sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-sm font-semibold">
              ₹{Math.round(product.price / 100).toLocaleString("en-IN")}
              {size ? ` · Size ${size}` : " · Select size"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
