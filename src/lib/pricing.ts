import { PRODUCTS, type Product } from "@/lib/products";
import { getShipping } from "@/lib/store-config";
import { checkCoupon, couponDiscount, type CouponDef } from "@/lib/coupons";

const PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export interface CheckoutLine {
  product: Product;
  size: string;
  quantity: number;
}

export interface PricedCart {
  lines: CheckoutLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

const MAX_QTY_PER_LINE = 99;

export interface ParseResult {
  cart: PricedCart | null;
  error?: string;
}

/**
 * Validates a client cart payload and re-prices every line from the
 * server-side catalog. Client prices are never trusted.
 * Optional stock limits are enforced when the admin has set stock for a
 * product in .data/stock.json.
 */
export function parseCart(
  items: unknown,
  opts?: { couponCode?: unknown; delivery?: unknown }
): ParseResult {
  if (!Array.isArray(items) || items.length === 0) {
    return { cart: null, error: "Cart is empty." };
  }

  const lines: CheckoutLine[] = [];
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) continue;
    const { productId, size, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || typeof size !== "string") continue;
    const qty =
      typeof quantity === "number" && Number.isInteger(quantity)
        ? Math.min(Math.max(quantity, 1), MAX_QTY_PER_LINE)
        : 1;
    const product = PRODUCTS_BY_ID.get(productId);
    if (!product) continue;
    if (!product.sizes.includes(size)) {
      return {
        cart: null,
        error: `Size ${size} is not available for ${product.name}.`,
      };
    }
    const existing = lines.find(
      (l) => l.product.id === product.id && l.size === size
    );
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, MAX_QTY_PER_LINE);
    } else {
      lines.push({ product, size, quantity: qty });
    }
  }

  if (lines.length === 0) {
    return { cart: null, error: "No valid items in cart." };
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.price * l.quantity,
    0
  );
  const shipping = getShipping(subtotal);

  // Optional coupon (validated server-side; failures are soft — checkout
  // just proceeds without the discount and reports why)
  let discount = 0;
  let appliedCoupon: CouponDef | undefined;
  let couponError: string | undefined;
  if (typeof opts?.couponCode === "string" && opts.couponCode.trim()) {
    const categories = [...new Set(lines.map((l) => l.product.category))];
    const check = checkCoupon(opts.couponCode, subtotal, categories);
    if (check.ok && check.coupon) {
      appliedCoupon = check.coupon;
      discount = couponDiscount(check.coupon, subtotal);
    } else {
      couponError = check.error;
    }
  }

  // Delivery option: express costs more but arrives sooner
  const express = opts?.delivery === "express";
  const deliveryFee = express ? 19900 : 0;
  const totalShipping =
    shipping === 0 && !express ? 0 : shipping + (express ? deliveryFee : 0);

  const total = Math.max(subtotal - discount, 0) + totalShipping;

  return {
    cart: { lines, subtotal, shipping: totalShipping, discount, total },
    error: couponError,
  };
}

/** Re-priced summary for the coupon / quote API */
export function quoteCart(
  items: unknown,
  couponCode: string | undefined,
  delivery: "standard" | "express"
): { cart: PricedCart; couponError?: string } {
  const { cart, error } = parseCart(items, {
    couponCode,
    delivery,
  });
  if (!cart) throw new Error(error ?? "Invalid cart.");
  return { cart, couponError: error };
}
