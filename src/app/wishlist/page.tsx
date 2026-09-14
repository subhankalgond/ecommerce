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
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Your wishlist ❤️</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {products.length} {products.length === 1 ? "item" : "items"} saved for later
      </p>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-4xl">♡</p>
          <p className="mt-4 text-lg font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Tap the heart on any product to save it here.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
