"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  searchProducts,
  getProductsByCategory,
  type Category,
  type Product,
} from "@/lib/products";
import ProductCard from "@/components/product-card";
import QuickViewModal from "@/components/quick-view-modal";

type SortKey =
  | "featured"
  | "popular"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "name", label: "Alphabetical (A–Z)" },
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
  const sortParam = (searchParams.get("sort") as SortKey) ?? "featured";

  const category: Category | "all" =
    categoryParam === "men" || categoryParam === "women" || categoryParam === "kids"
      ? categoryParam
      : "all";

  const [sort, setSort] = useState<SortKey>(
    SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam : "featured"
  );
  const [outOfStock, setOutOfStock] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "editorial">("grid");

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

  // Filter application
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

  // Derivations
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
  else if (sort === "newest") sorted.sort((a, b) => b.id.localeCompare(a.id));
  else if (sort === "popular")
    sorted.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  else if (sort === "featured")
    sorted.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  const activeCategory = CATEGORIES.find((c) => c.value === category)!;
  const hasFilters =
    Boolean(qParam) ||
    saleParam ||
    category !== "all" ||
    Boolean(sizeParam) ||
    Boolean(colorParam) ||
    Boolean(priceParam) ||
    stockParam;

  // Editorial collection descriptions
  const collectionDesc = useMemo(() => {
    if (qParam) return `Showing garments catalogued under “${qParam}”.`;
    if (saleParam) return "Curated archival and seasonal pieces available at preferential pricing.";
    if (category === "women") return "Tailored shirting, effortless day dresses, and tactile knitwear designed for lasting wear.";
    if (category === "men") return "Structural jackets, dense pima cotton staples, and relaxed denim silhouettes.";
    if (category === "kids") return "GOTS-certified organic cotton essentials and durable garments built for unhindered play.";
    return "Thoughtful wardrobe essentials for men, women and kids. Every piece is crafted from enduring natural fabrics.";
  }, [qParam, saleParam, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* ── Collection Header ────────────────────────────────────────── */}
      <div className="border-b border-[#e5dfd5] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              {qParam ? "Search Results" : "Nova Threads Catalogue"}
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl text-[#171614] leading-tight">
              {qParam
                ? `Results for “${qParam}”`
                : saleParam
                  ? `${activeCategory.label === "All" ? "Archive" : activeCategory.label} · The Sale Edit`
                  : activeCategory.label === "All"
                    ? "Complete Collection"
                    : `${activeCategory.label}'s Wardrobe`}
            </h1>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#615a51]">
              {collectionDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center border border-[#ded7ca] bg-[#faf8f5] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view (4 columns)"
                className={`p-1.5 transition ${
                  viewMode === "grid" ? "bg-[#171614] text-white" : "text-[#7a7368] hover:text-[#171614]"
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h2A1.5 1.5 0 0 1 6 2.5v2A1.5 1.5 0 0 1 4.5 6h-2A1.5 1.5 0 0 1 1 4.5v-2zm8 0A1.5 1.5 0 0 1 10.5 1h2A1.5 1.5 0 0 1 14 2.5v2A1.5 1.5 0 0 1 12.5 6h-2A1.5 1.5 0 0 1 9 4.5v-2zm-8 8A1.5 1.5 0 0 1 2.5 9h2A1.5 1.5 0 0 1 6 10.5v2A1.5 1.5 0 0 1 4.5 14h-2A1.5 1.5 0 0 1 1 12.5v-2zm8 0A1.5 1.5 0 0 1 10.5 9h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 9 12.5v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("editorial")}
                aria-label="Editorial view (2 columns)"
                className={`p-1.5 transition ${
                  viewMode === "editorial" ? "bg-[#171614] text-white" : "text-[#7a7368] hover:text-[#171614]"
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3zm7 1v8h5V4H8zm-1 0H3v8h4V4z" />
                </svg>
              </button>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 border border-[#ded7ca] bg-[#faf8f5] px-3 py-2 text-xs">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8c857b]">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  const val = e.target.value as SortKey;
                  setSort(val);
                  setParam({ sort: val });
                }}
                className="bg-transparent text-xs font-medium text-[#171614] focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-1.5 border border-[#171614] bg-[#171614] px-3.5 py-2 text-xs font-semibold tracking-wider uppercase text-white md:hidden"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() =>
                setParam({
                  category: cat.value === "all" ? null : cat.value,
                })
              }
              className={`border px-4 py-1.5 text-xs font-medium tracking-wider uppercase transition ${
                category === cat.value
                  ? "border-[#171614] bg-[#171614] text-[#faf8f5]"
                  : "border-[#ded7ca] bg-[#f7f4ee] text-[#544e45] hover:border-[#171614] hover:text-[#171614]"
              }`}
            >
              {cat.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setParam({ sale: saleParam ? null : "1" })}
            className={`border px-4 py-1.5 text-xs font-medium tracking-wider uppercase transition ${
              saleParam
                ? "border-[#8b5a42] bg-[#8b5a42] text-white"
                : "border-[#e0d6cb] bg-[#f7f4ee] text-[#8b5a42] hover:border-[#8b5a42]"
            }`}
          >
            The Sale Edit
          </button>

          <button
            type="button"
            onClick={() => setParam({ stock: stockParam ? null : "1" })}
            className={`border px-4 py-1.5 text-xs font-medium tracking-wider uppercase transition ${
              stockParam
                ? "border-[#515c4d] bg-[#515c4d] text-white"
                : "border-[#ded7ca] bg-[#f7f4ee] text-[#515c4d] hover:border-[#515c4d]"
            }`}
          >
            In Stock Only
          </button>
        </div>

        {/* Desktop Refinement Filters Bar */}
        <div className="mt-6 hidden md:grid md:grid-cols-4 gap-4 border-t border-[#e5dfd5] pt-4 text-xs">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
              Size
            </label>
            <select
              value={sizeParam}
              onChange={(e) => setParam({ size: e.target.value || null })}
              className="w-full border border-[#ded7ca] bg-white px-2.5 py-1.5 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            >
              <option value="">All Sizes</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
              Colour
            </label>
            <select
              value={colorParam}
              onChange={(e) => setParam({ color: e.target.value || null })}
              className="w-full border border-[#ded7ca] bg-white px-2.5 py-1.5 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            >
              <option value="">All Colours</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#8c857b] mb-1">
              Price Range
            </label>
            <select
              value={priceParam}
              onChange={(e) => setParam({ price: e.target.value || null })}
              className="w-full border border-[#ded7ca] bg-white px-2.5 py-1.5 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            >
              <option value="">Any Price</option>
              {PRICE_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {hasFilters ? (
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="w-full border border-[#d1c8b9] bg-[#f5f0e8] py-1.5 text-xs font-semibold tracking-wider uppercase text-[#615a51] hover:border-[#171614] hover:text-[#171614] transition"
              >
                Reset All Filters
              </button>
            ) : (
              <div className="w-full py-1.5 text-[11px] text-[#8c857b]">
                Showing {sorted.length} {sorted.length === 1 ? "garment" : "garments"}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c857b]">Active:</span>
            {category !== "all" && (
              <span className="inline-flex items-center gap-1 border border-[#ded7ca] bg-white px-2 py-0.5 text-[11px] text-[#3a3733]">
                Category: {activeCategory.label}
                <button
                  type="button"
                  onClick={() => setParam({ category: null })}
                  className="hover:text-[#8b5a42] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {saleParam && (
              <span className="inline-flex items-center gap-1 border border-[#e0d6cb] bg-white px-2 py-0.5 text-[11px] text-[#8b5a42]">
                Sale items
                <button
                  type="button"
                  onClick={() => setParam({ sale: null })}
                  className="hover:text-[#6f4430] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {sizeParam && (
              <span className="inline-flex items-center gap-1 border border-[#ded7ca] bg-white px-2 py-0.5 text-[11px] text-[#3a3733]">
                Size: {sizeParam}
                <button
                  type="button"
                  onClick={() => setParam({ size: null })}
                  className="hover:text-[#8b5a42] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {colorParam && (
              <span className="inline-flex items-center gap-1 border border-[#ded7ca] bg-white px-2 py-0.5 text-[11px] text-[#3a3733]">
                Colour: {colorParam}
                <button
                  type="button"
                  onClick={() => setParam({ color: null })}
                  className="hover:text-[#8b5a42] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {priceParam && (
              <span className="inline-flex items-center gap-1 border border-[#ded7ca] bg-white px-2 py-0.5 text-[11px] text-[#3a3733]">
                Price: {PRICE_BUCKETS.find((b) => b.id === priceParam)?.label}
                <button
                  type="button"
                  onClick={() => setParam({ price: null })}
                  className="hover:text-[#8b5a42] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {stockParam && (
              <span className="inline-flex items-center gap-1 border border-[#ded7ca] bg-white px-2 py-0.5 text-[11px] text-[#515c4d]">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setParam({ stock: null })}
                  className="hover:text-[#384035] ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="text-[11px] text-[#8b5a42] underline hover:text-[#6f4430] ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Product Grid or Empty State ─────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#d5cfc4] text-[#8c857b]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[#171614]">
            {nonClothingQuery ? "Catalogue Scope: Apparel & Accessories Only" : "No Pieces Matched Your Selection"}
          </h2>
          <p className="mt-2 text-xs text-[#6b645b] max-w-md mx-auto leading-relaxed">
            {nonClothingQuery
              ? "Nova Threads designs everyday clothing for men, women and kids. Please try searching for garments such as shirts, denims, knitwear, jackets, or dresses."
              : "Try adjusting or clearing your filters, or explore the complete catalogue."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`mt-10 grid gap-x-6 gap-y-12 ${
            viewMode === "editorial"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {sorted.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              aspectRatio={viewMode === "editorial" ? "aspect-[4/5]" : "aspect-[3/4]"}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Mobile Filters Slide-over */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative flex h-full w-full max-w-xs flex-col bg-[#faf8f5] shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-[#e5dfd5] pb-4">
              <span className="font-serif text-lg text-[#171614]">Refine Catalogue</span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="text-[#615a51] hover:text-[#171614]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto space-y-6 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-[#8c857b] mb-2">Category</p>
                <div className="space-y-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setParam({ category: cat.value === "all" ? null : cat.value });
                        setMobileFilterOpen(false);
                      }}
                      className={`block w-full text-left py-1 ${
                        category === cat.value ? "font-bold text-[#8b5a42]" : "text-[#3a3733]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#ede6da] pt-4">
                <p className="font-semibold uppercase tracking-wider text-[#8c857b] mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setParam({ size: sizeParam === s ? null : s });
                        setMobileFilterOpen(false);
                      }}
                      className={`border px-2.5 py-1 text-xs ${
                        sizeParam === s
                          ? "border-[#171614] bg-[#171614] text-white"
                          : "border-[#ded7ca] bg-white text-[#544e45]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#ede6da] pt-4">
                <p className="font-semibold uppercase tracking-wider text-[#8c857b] mb-2">Price</p>
                <div className="space-y-1.5">
                  {PRICE_BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setParam({ price: priceParam === b.id ? null : b.id });
                        setMobileFilterOpen(false);
                      }}
                      className={`block w-full text-left py-1 ${
                        priceParam === b.id ? "font-bold text-[#8b5a42]" : "text-[#3a3733]"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5dfd5] pt-4 mt-auto">
              <button
                type="button"
                onClick={() => {
                  router.push("/products");
                  setMobileFilterOpen(false);
                }}
                className="w-full border border-[#171614] bg-[#171614] py-2.5 text-xs font-semibold tracking-wider uppercase text-white"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
