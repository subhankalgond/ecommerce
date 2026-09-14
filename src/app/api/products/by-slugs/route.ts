import { NextResponse } from "next/server";
import { allProducts } from "@/lib/product-store";

/** POST { slugs: string[] } — products for the recently-viewed rail */
export async function POST(request: Request) {
  let body: { slugs?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const slugs = Array.isArray(body.slugs)
    ? (body.slugs as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 12)
    : [];
  if (slugs.length === 0) return NextResponse.json({ products: [] });
  const set = new Set(slugs);
  const products = allProducts().filter((p) => set.has(p.slug));
  return NextResponse.json({ products });
}
