import type { Product } from "@/lib/products";

export type ClientProduct = Product;

/**
 * The wishlist API returns full Product JSON. This adapter keeps the client
 * pages decoupled from the exact server shape (and lets us add fields later).
 */
export function allProductsClient(p: Product): Product {
  return p;
}
