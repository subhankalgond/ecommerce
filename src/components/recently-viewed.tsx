"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, type Product } from "@/lib/products";

const KEY = "nova-threads-recently-viewed";

export function recordView(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 8);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewed();
    if (slugs.length === 0) return;
    fetch("/api/products/by-slugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => r.json())
      .then((d: { products?: Product[] }) => {
        // preserve recency order
        const bySlug = new Map((d.products ?? []).map((p) => [p.slug, p]));
        setProducts(slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p)));
      })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <h2 className="text-2xl font-bold sm:text-3xl">Recently viewed</h2>
      <p className="mt-1 text-sm text-neutral-500">Pick up where you left off.</p>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group w-36 shrink-0"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={p.image}
                alt={p.name}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="144px"
              />
            </div>
            <p className="mt-2 truncate text-xs font-medium">{p.name}</p>
            <p className="text-xs font-semibold text-neutral-700">
              {formatPrice(p.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
