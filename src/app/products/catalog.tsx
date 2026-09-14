"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  searchProducts,
  getProductsByCategory,
  type Category,
} from "@/lib/products";
import { ratingMap } from "@/lib/reviews";
import ProductCard from "@/components/product-card";

type SortKey =
  | "featured"
  | "popular"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name: A to Z" },
];

const PRICE_BUCKETS = [
  { id: "under-999", label: "Under ₹999", min: 0, max: 99900 },
  { id: "1000-1999", label: "₹1,000 – ₹1,999", min: 100000, max: 199900 },
  { id: "2000-4999", label: "₹2,000 – ₹4,999", min: 200000, max: 499900 },
  { id: "5000-plus", label: "₹5,000+", min: 500000, max: Infinity },
];

export default function Catalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const qParam = searchParams.get("q") ?? "";
  const saleParam = searchParams.get("sale") === "1";
  const sizeParam = searchParams.get("size") ?? "";
  const colorParam = searchParams.get("color") ?? "";
  const priceParam = searchParams.get("price") ?? "";
  const stockParam = searchParams.get("stock") === "1";

  const category: Category | "all" =
    categoryParam === "men" || categoryParam === "women" || categoryParam === "kids"
      ? categoryParam
      : "all";

  const [sort, setSort] = useState<SortKey>("featured");
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({});
  const [outOfStock, setOutOfStock] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d: { outOfStock?: string[] }) => {
        if (!cancelled) setOutOfStock(new Set(d.outOfStock ?? []));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      router.push(`/products${params.size ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams]
  );

  // Start from the searched set, then narrow by filters
  const searchResult = qParam ? searchProducts(qParam) : null;
  let products = searchResult
    ? searchResult.products
    : getProductsByCategory(category);
  if (saleParam) {
    products = products.filter((p) => p.compareAtPrice !== undefined);
  }
  if (sizeParam) {
    products = products.filter((p) => p.sizes.includes(sizeParam));
  }
  if (colorParam) {
    products = products.filter((p) =>
      p.colors.some((c) => c.toLowerCase().includes(colorParam.toLowerCase()))
    );
  }
  if (priceParam) {
    const bucket = PRICE_BUCKETS.find((b) => b.id === priceParam);
    if (bucket) {
      products = products.filter(
        (p) => p.price >= bucket.min && p.price <= bucket.max
      );
    }
  }
  if (stockParam) {
    products = products.filter((p) => !outOfStock.has(p.id));
  }
  const nonClothingQuery =
    searchResult !== null && !searchResult.isClothingQuery;

  // derive filter option lists from the current (pre-sort) set
  const sizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes))],
    [products]
  );
  const colors = useMemo(
    () => [...new Set(products.flatMap((p) => p.colors))].sort(),
    [products]
  );

  const sorted = [...products];
  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "rating")
    sorted.sort(
      (a, b) => (ratings[b.id]?.average ?? 0) - (ratings[a.id]?.average ?? 0)
    );
  else if (sort === "newest")
    sorted.sort((a, b) => b.id.localeCompare(a.id));
  else if (sort === "popular")
    sorted.sort(
      (a, b) => (ratings[b.id]?.count ?? 0) - (ratings[a.id]?.count ?? 0)
    );
  else if (sort === "featured")
    sorted.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  const activeCategory = CATEGORIES.find((c) => c.value === category)!;
  const hasFilters =
    qParam || saleParam || category !== "all" || sizeParam || colorParam || priceParam || stockParam;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {qParam
              ? `Results for “${qParam}”`
              : saleParam
                ? `${activeCategory.label === "All" ? "All" : activeCategory.label} · Sale`
                : activeCategory.label === "All"
                  ? "All products"
                  : `${activeCategory.label}'s clothing`}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {sorted.length} {sorted.length === 1 ? "product" : "products"}
            {saleParam && " on sale"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() =>
              setParam({
                category: cat.value === "all" ? null : cat.value,
              })
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === cat.value
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setParam({ sale: saleParam ? null : "1" })}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            saleParam
              ? "bg-rose-600 text-white"
              : "border border-rose-200 text-rose-600 hover:bg-rose-50"
          }`}
        >
          On sale
        </button>
        <button
          type="button"
          onClick={() => setParam({ stock: stockParam ? null : "1" })}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            stockParam
              ? "bg-emerald-600 text-white"
              : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          In stock only
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Refinement filters */}
      <div className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-neutral-600">
          Size
          <select
            value={sizeParam}
            onChange={(e) => setParam({ size: e.target.value || null })}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          >
            <option value="">Any size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Colour
          <select
            value={colorParam}
            onChange={(e) => setParam({ color: e.target.value || null })}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          >
            <option value="">Any colour</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Price
          <select
            value={priceParam}
            onChange={(e) => setParam({ price: e.target.value || null })}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          >
            <option value="">Any price</option>
            {PRICE_BUCKETS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Brand
          <select
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-400"
            title="Single-brand demo store — every product is Nova Threads"
          >
            <option>Nova Threads</option>
          </select>
        </label>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 text-lg font-medium">
            {nonClothingQuery
              ? "That doesn't look like clothing"
              : "No products found"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {nonClothingQuery
              ? "This store only sells clothing. Try searching for a garment, e.g. \"tshirt\", \"jeans\", \"jacket\" or \"saree\"."
              : "Try a different search term (misspellings are OK!) or clear the filters."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Browse everything
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
