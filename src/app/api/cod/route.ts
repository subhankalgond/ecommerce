import { NextResponse } from "next/server";
import { parseCart } from "@/lib/pricing";
import { recordOrder, isBlocked } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify";
import { redeemCoupon, findCoupon } from "@/lib/coupons";
import type { ShippingAddress } from "@/lib/order-types";

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const phoneOk = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/\D/g, ""));
const pinOk = (p: string) => /^[1-9]\d{5}$/.test(p);

/**
 * Cash on Delivery checkout. Creates the order immediately in "placed"
 * status with paymentMethod "cod". No payment gateway involved.
 */
export async function POST(request: Request) {
  let body: {
    email?: unknown;
    items?: unknown;
    coupon?: unknown;
    delivery?: unknown;
    address?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!emailOk(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (isBlocked(email)) {
    return NextResponse.json({ error: "This account cannot place orders." }, { status: 403 });
  }

  const addr = (body.address ?? {}) as Record<string, unknown>;
  const address: ShippingAddress = {
    fullName: typeof addr.fullName === "string" ? addr.fullName.trim().slice(0, 100) : "",
    phone: typeof addr.phone === "string" ? addr.phone.replace(/\D/g, "").slice(0, 10) : "",
    line1: typeof addr.line1 === "string" ? addr.line1.trim().slice(0, 200) : "",
    line2: typeof addr.line2 === "string" ? addr.line2.trim().slice(0, 200) : undefined,
    city: typeof addr.city === "string" ? addr.city.trim().slice(0, 80) : "",
    state: typeof addr.state === "string" ? addr.state.trim().slice(0, 80) : "",
    pincode: typeof addr.pincode === "string" ? addr.pincode.trim().slice(0, 10) : "",
  };

  if (!address.fullName || !address.line1 || !address.city || !address.state) {
    return NextResponse.json({ error: "Please fill the complete delivery address." }, { status: 400 });
  }
  if (!phoneOk(address.phone)) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (!pinOk(address.pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  }

  const delivery = body.delivery === "express" ? "express" : "standard";
  const coupon = typeof body.coupon === "string" ? body.coupon.trim() : undefined;
  const { cart, error: couponError } = parseCart(body.items, { couponCode: coupon, delivery });
  if (!cart) {
    return NextResponse.json({ error: couponError ?? "Invalid cart." }, { status: 400 });
  }

  // COD is only available for orders up to ₹50,000 (common store policy)
  if (cart.total > 5000000) {
    return NextResponse.json(
      { error: "Cash on Delivery is not available above ₹50,000 — please pay online." },
      { status: 400 }
    );
  }

  const subtotal = cart.subtotal;
  const items = cart.lines.map((l) => ({
    productId: l.product.id,
    slug: l.product.slug,
    name: l.product.name,
    image: l.product.image,
    size: l.size,
    qty: l.quantity,
    price: l.product.price,
  }));

  const { order, created } = recordOrder({
    provider: "cod",
    paymentRef: `cod_${Date.now()}`,
    email,
    items,
    subtotal,
    shipping: cart.shipping,
    discount: cart.discount,
    coupon:
      cart.discount > 0 && coupon
        ? (() => {
            const def = findCoupon(coupon);
            return {
              code: coupon.toUpperCase(),
              type: def?.type ?? ("percentage" as const),
              value: def?.value ?? 0,
              discount: cart.discount,
            };
          })()
        : undefined,
    total: cart.total,
    currency: "INR",
    address,
    paymentMethod: "cod",
    deliveryOption: delivery,
  });

  // count the coupon redemption once (idempotent guard via `created`)
  if (created && cart.discount > 0 && coupon) {
    redeemCoupon(coupon);
  }

  // fire-and-forget admin notification
  if (created) notifyNewOrder(order).catch(() => {});

  return NextResponse.json({ ok: true, orderId: order.id, total: order.total });
}
