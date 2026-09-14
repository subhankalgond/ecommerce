import { NextResponse } from "next/server";
import { ratingMap } from "@/lib/reviews";
import { PRODUCTS } from "@/lib/products";

/** GET — rating summary for the whole catalog (used by the product grid) */
export function GET() {
  return NextResponse.json({ ratings: ratingMap(PRODUCTS.map((p) => p.id)) });
}
