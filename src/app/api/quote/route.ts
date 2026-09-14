import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/pricing";

/**
 * Quote a cart server-side: subtotal, shipping (by delivery option),
 * coupon discount and total. Used by the cart and checkout pages so
 * coupon math always matches what payment routes charge.
 */
export async function POST(request: Request) {
  let body: { items?: unknown; coupon?: unknown; delivery?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const coupon = typeof body.coupon === "string" ? body.coupon : undefined;
  const delivery =
    body.delivery === "express" ? "express" : ("standard" as const);

  try {
    const { cart, couponError } = quoteCart(body.items, coupon, delivery);
    return NextResponse.json({
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      couponError,
      couponApplied: cart.discount > 0 ? (coupon ?? null) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
