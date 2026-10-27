"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/components/wishlist-provider";
import ProductCard from "@/components/product-card";
import type { Product } from "@/lib/products";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("nova-threads-visitor");
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem("nova-threads-visitor", id);
  }
  return id;
}

export default function WishlistPage() {
  const { ids, hydrated } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetch("/api/wishlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    })
      .then((r) => r.json())
      .then((d: { products?: Product[] }) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [ids, hydrated]);

  if (!hydrated || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-56 animate-pulse bg-[#ede8df]" />
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-[#ede8df]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#e5dfd5] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Personal Curation
          </span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
            Saved Garments &amp; Wishlist
          </h1>
          <p className="mt-1 text-xs text-[#615a51]">
            {products.length} {products.length === 1 ? "piece" : "pieces"} saved for future consideration.
          </p>
        </div>

        {products.length > 0 && (
          <Link
            href="/products"
            className="text-xs font-semibold tracking-wider uppercase text-[#171614] hover:text-[#8b5a42] transition"
          >
            Continue Browsing Catalogue →
          </Link>
        )}
      </div>

      {/* Wishlist Items or Empty State */}
      {products.length === 0 ? (
        <div className="py-28 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[#171614]">
            Your Saved Collection is Empty
          </h2>
          <p className="mt-2 text-xs text-[#6b645b] max-w-sm mx-auto leading-relaxed">
            Select the heart icon while exploring our collections to gather your preferred essentials in this space.
          </p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-block border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition"
            >
              Explore Catalogue
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
