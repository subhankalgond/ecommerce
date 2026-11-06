"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] ?? null);
      setSelectedColor(product.colors[0] ?? "");
      setQuantity(1);
      setError(null);
      setAdded(false);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const compareAt = product.compareAtPrice;
  const onSale = compareAt !== undefined && compareAt > product.price;
  const wishlisted = has(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError("Please select a size to proceed.");
      return;
    }
    setError(null);
    addItem(product, selectedSize, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${product.name}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl overflow-hidden border border-[#e5dfd5] bg-[#faf8f5] shadow-2xl z-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center border border-[#ded7ca] bg-[#faf8f5]/90 text-[#171614] hover:bg-[#171614] hover:text-white transition"
          aria-label="Close modal"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[3/4] md:aspect-auto md:h-full bg-[#ede8df] min-h-[300px]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {onSale && (
              <span className="absolute left-4 top-4 border border-[#8b5a42] bg-[#faf8f5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8b5a42]">
                Sale Archive
              </span>
            )}
          </div>

          {/* Details & Interactive Actions */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                {product.category}&apos;s Wardrobe · SKU NT-{product.id.toUpperCase()}
              </span>

              <h2 className="mt-1 font-serif text-2xl text-[#171614]">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-lg font-bold text-[#171614]">
                  {formatPrice(product.price)}
                </span>
                {onSale && compareAt && (
                  <span className="text-xs text-[#9c958a] line-through">
                    {formatPrice(compareAt)}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#5e584f] line-clamp-3">
                {product.description}
              </p>

              {/* Color Select */}
              {product.colors.length > 1 && (
                <div className="mt-5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8c857b]">
                    Colour: <strong className="text-[#171614]">{selectedColor}</strong>
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`border px-3 py-1 text-xs transition ${
                          selectedColor === c
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

              {/* Size Select */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8c857b]">
                    Select Size
                  </span>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="text-[11px] text-[#8b5a42] underline hover:text-[#6f4430]"
                  >
                    Size Guide
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedSize(s);
                        setError(null);
                      }}
                      className={`h-9 min-w-9 border px-2.5 text-xs font-medium transition ${
                        selectedSize === s
                          ? "border-[#171614] bg-[#171614] text-white"
                          : "border-[#ded7ca] bg-white text-[#544e45] hover:border-[#171614]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8c857b]">
                  Quantity
                </span>
                <div className="flex items-center border border-[#ded7ca] bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center text-sm text-[#171614] hover:bg-[#ede6da]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-8 w-8 items-center justify-center text-sm text-[#171614] hover:bg-[#ede6da]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {error && (
                <p className="mt-2 text-xs text-[#8b5a42]">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2 pt-4 border-t border-[#ede6da]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 border py-3 text-xs font-semibold tracking-[0.14em] uppercase transition ${
                    added
                      ? "border-[#515c4d] bg-[#515c4d] text-white"
                      : "border-[#171614] bg-[#171614] text-[#faf8f5] hover:bg-[#33302b]"
                  }`}
                >
                  {added ? "✓ Added to Bag" : "Add to Shopping Bag"}
                </button>

                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  className={`flex h-11 w-11 items-center justify-center border transition ${
                    wishlisted
                      ? "border-[#8b5a42] bg-[#8b5a42] text-white"
                      : "border-[#ded7ca] bg-white text-[#3a3733] hover:border-[#171614]"
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

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="block text-center text-[11px] font-medium tracking-wider uppercase text-[#736c62] hover:text-[#171614] py-1 transition"
              >
                View Full Product Page &amp; Care Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

