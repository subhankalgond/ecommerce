import { NextResponse } from "next/server";
import { PRODUCTS, type Product } from "@/lib/products";
import { ratingMap } from "@/lib/reviews";

/**
 * Search suggestions for the header search bar. GET /api/suggest?q=…
 * Returns up to 6 name matches (typo-tolerant via the same engine the
 * catalog uses) plus their product images.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const needle = q.toLowerCase();
  // cheap contains-match on name + tags + colors first…
  let matches = PRODUCTS.filter((p) =>
    [p.name, ...p.tags, ...p.colors].some((t) => t.toLowerCase().includes(needle))
  );
  // …then fall back to the fuzzy engine for misspellings
  if (matches.length === 0) {
    const { searchProducts } = await import("@/lib/search");
    matches = searchProducts(q).products;
  }

  const top = matches.slice(0, 6);
  const suggestions = top.map((p: Product) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.image,
    price: p.price,
    category: p.category,
  }));
  const ratings = ratingMap(top.map((p) => p.id));
  return NextResponse.json({ suggestions, ratings });
}
