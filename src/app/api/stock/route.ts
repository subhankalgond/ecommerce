import { NextResponse } from "next/server";
import { loadStock } from "@/lib/orders";
import { allProducts, isEnabled } from "@/lib/product-store";

/**
 * Public availability map. Products without an entry have unlimited stock.
 * Out-of-stock ids are included so the catalog can grey them out.
 */
export function GET() {
  const stock = loadStock();
  const outOfStock = allProducts()
    .filter((p) => isEnabled(p.id) && stock[p.id] === 0)
    .map((p) => p.id);
  return NextResponse.json({ stock, outOfStock });
}
