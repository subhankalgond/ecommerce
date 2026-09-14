import { NextResponse } from "next/server";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";
import { allProducts } from "@/lib/product-store";

/**
 * Wishlist for guest visitors. The client generates a stable visitor id
 * (stored in localStorage); the server keeps wishlists keyed by it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const visitorId = url.searchParams.get("visitorId") ?? "";
  if (!visitorId) return NextResponse.json({ productIds: [] });
  return NextResponse.json({ productIds: getWishlist(visitorId) });
}

export async function POST(request: Request) {
  let body: { visitorId?: unknown; productId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!visitorId || !productId) {
    return NextResponse.json({ error: "visitorId and productId are required." }, { status: 400 });
  }
  const productIds = toggleWishlist(visitorId, productId);
  return NextResponse.json({ ok: true, productIds });
}

/** GET with ?expand=1 returns full product cards for the wishlist page */
export async function PUT(request: Request) {
  let body: { visitorId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const ids = new Set(getWishlist(visitorId));
  const products = allProducts().filter((p) => ids.has(p.id));
  return NextResponse.json({ products });
}
