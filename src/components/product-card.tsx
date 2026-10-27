"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, type Product } from "@/lib/products";
import { useWishlist } from "@/components/wishlist-provider";

interface ProductCardProps {
  product: Product;
  rating?: { count: number; average: number };
  aspectRatio?: string;
}

export default function ProductCard({ product }: ProductCardProps) {
  const compareAt = product.compareAtPrice;
  const onSale = compareAt !== undefined && compareAt > product.price;
  const { has, toggle } = useWishlist();
  const [imageError, setImageError] = useState(false);
  const wishlisted = has(product.id);

  // Fallback image if unsplash link ever fails
  const imgSrc = imageError
    ? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop"
    : product.image;

  return (
    <div className="group relative flex flex-col">
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ede8df]">
        <Link
          href={`/products/${product.slug}`}
          className="block h-full w-full"
          tabIndex={0}
          aria-label={`View ${product.name}`}
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            onError={() => setImageError(true)}
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Badges: Sale */}
        {onSale && (
          <span className="absolute left-3 top-3 border border-[#8b5a42] bg-[#faf8f5]/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-[#8b5a42]">
            Sale
          </span>
        )}

        {/* Wishlist Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border transition ${
            wishlisted
              ? "border-[#8b5a42] bg-[#8b5a42] text-[#faf8f5]"
              : "border-[#e5dfd5] bg-[#faf8f5]/90 text-[#3a3733] hover:border-[#171614] hover:text-[#171614]"
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

        {/* Quick Sizes Preview on Desktop Hover */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block">
            <p className="text-[10px] tracking-widest uppercase text-white/90">
              Sizes: {product.sizes.join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="pt-3 pb-1">
        <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#8c857b]">
          {product.category}
        </p>

        <Link
          href={`/products/${product.slug}`}
          className="mt-1 block font-serif text-sm font-normal text-[#171614] group-hover:text-[#8b5a42] transition"
        >
          {product.name}
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xs font-semibold text-[#171614]">
            {formatPrice(product.price)}
          </span>
          {onSale && compareAt && (
            <span className="text-[11px] text-[#9c958a] line-through">
              {formatPrice(compareAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
