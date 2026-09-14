"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { useWishlist } from "@/components/wishlist-provider";

export default function ProductCard({ product, rating }: { product: Product; rating?: { count: number; average: number } }) {
  const compareAt = product.compareAtPrice;
  const onSale = compareAt !== undefined;
  const { has, toggle } = useWishlist();

  return (
    <div className="group relative block">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {onSale && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
              Sale
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize text-neutral-700">
            {product.category}
          </span>
        </div>
        <div className="mt-3">
          <p className="truncate text-sm font-medium text-neutral-900 group-hover:underline">
            {product.name}
          </p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-neutral-400 line-through">
                {formatPrice(compareAt)}
              </span>
            )}
          </p>
          {rating && rating.count > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <span className="text-amber-500" aria-hidden>
                {"★".repeat(Math.round(rating.average))}
                <span className="text-neutral-300">
                  {"★".repeat(5 - Math.round(rating.average))}
                </span>
              </span>
              <span>
                {rating.average} ({rating.count})
              </span>
            </p>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(product.id);
        }}
        aria-label={has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={has(product.id)}
        className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
          has(product.id)
            ? "bg-rose-600 text-white"
            : "bg-white/90 text-neutral-500 hover:text-rose-600"
        }`}
      >
        {has(product.id) ? "❤" : "♡"}
      </button>
    </div>
  );
}
