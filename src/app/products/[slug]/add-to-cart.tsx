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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const requireSize = (): string | null => {
    if (!size) {
      setError("Please select a size to proceed.");
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
    router.push("/checkout");
  };

  const wishlisted = has(product.id);

  return (
    <div>
      {/* Colour Selection */}
      {product.colors.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8c857b]">
              Colour
            </span>
            <span className="text-xs text-[#171614] font-medium">{color}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={`border px-3.5 py-1.5 text-xs font-medium transition ${
                  color === c
                    ? "border-[#171614] bg-[#171614] text-white"
                    : "border-[#ded7ca] bg-white text-[#544e45] hover:border-[#171614]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8c857b]">
            Select Size
          </span>
          <button
            type="button"
            onClick={() => setSizeGuideOpen(true)}
            className="text-xs text-[#8b5a42] underline underline-offset-2 hover:text-[#6f4430] transition"
          >
            Size &amp; Fit Guide
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSize(s);
                setError(null);
              }}
              aria-pressed={size === s}
              className={`min-w-12 border px-3.5 py-2 text-xs font-medium tracking-wider uppercase transition ${
                size === s
                  ? "border-[#171614] bg-[#171614] text-white"
                  : "border-[#ded7ca] bg-white text-[#171614] hover:border-[#171614]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-xs text-[#8b5a42] font-medium">
            {error}
          </p>
        )}
      </div>

      {/* Quantity & Actions */}
      <div className="flex items-center gap-3">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-[#ded7ca] bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2.5 text-xs text-[#615a51] hover:text-[#171614]"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-xs font-semibold text-[#171614]">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="px-3 py-2.5 text-xs text-[#615a51] hover:text-[#171614]"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Primary Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="flex-1 border border-[#171614] bg-[#171614] py-3 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {inStock ? "Add to Shopping Bag" : "Currently Out of Stock"}
        </button>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          className={`flex h-11 w-11 items-center justify-center border transition ${
            wishlisted
              ? "border-[#8b5a42] bg-[#8b5a42] text-white"
              : "border-[#ded7ca] bg-white text-[#3a3733] hover:border-[#171614] hover:text-[#171614]"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={wishlisted ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      {/* Buy Now Direct Route */}
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock || buying}
        className="mt-3 w-full border border-[#171614] bg-transparent py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#171614] hover:bg-[#ede8df] transition disabled:opacity-40"
      >
        {buying ? "Redirecting to checkout…" : "Instant Checkout"}
      </button>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSizeGuideOpen(false)}
          />
          <div className="relative w-full max-w-lg border border-[#e5dfd5] bg-[#faf8f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5dfd5] pb-3">
              <h3 className="font-serif text-lg text-[#171614]">Size &amp; Fit Guide</h3>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="text-[#615a51] hover:text-[#171614]"
              >
                ✕
              </button>
            </div>
            
            <div className="mt-4 space-y-4 text-xs text-[#544e45] leading-relaxed">
              <div>
                <p className="font-semibold text-[#171614] uppercase tracking-wider">Adult Tops &amp; Shirts (Chest)</p>
                <p className="mt-1">XS: 34″ · S: 36″ · M: 38–40″ · L: 40–42″ · XL: 42–44″ · XXL: 44–46″</p>
              </div>
              <div>
                <p className="font-semibold text-[#171614] uppercase tracking-wider">Adult Bottoms &amp; Denims (Waist)</p>
                <p className="mt-1">XS: 26–28″ · S: 28–30″ · M: 30–32″ · L: 32–34″ · XL: 34–36″ · XXL: 36–38″</p>
              </div>
              <div>
                <p className="font-semibold text-[#171614] uppercase tracking-wider">Kids Garments (Age Guide)</p>
                <p className="mt-1">2Y (2 years) · 4Y · 6Y · 8Y · 10Y. If in between sizes, sizing up is recommended.</p>
              </div>
              <p className="border-t border-[#e5dfd5] pt-3 text-[11px] text-[#7a7368]">
                All garments undergo pre-washing to prevent shrinkage. For further sizing assistance, contact client care.
              </p>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="border border-[#171614] bg-[#171614] px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bar */}
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-[#e5dfd5] bg-[#faf8f5]/95 p-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-xs text-[#171614]">{product.name}</p>
            <p className="text-xs font-semibold text-[#171614]">
              ₹{Math.round(product.price / 100).toLocaleString("en-IN")}
              {size ? ` · Size ${size}` : " · Select size"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="border border-[#171614] bg-[#171614] px-5 py-2 text-xs font-semibold tracking-wider uppercase text-white disabled:opacity-40"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
