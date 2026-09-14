import { NextResponse } from "next/server";
import { findOrder, maskEmail, getEvents, TRACKING_STEPS } from "@/lib/orders";

/** Public order lookup for /track — by order id (NT-XXXXXX) or payment id. */
export async function POST(request: Request) {
  let body: { query?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: "Enter your order ID (it looks like NT-4KD9P2)." },
      { status: 400 }
    );
  }

  const order = findOrder(query);
  if (!order) {
    return NextResponse.json(
      { error: "No order found with that ID. Check your confirmation page or email." },
      { status: 404 }
    );
  }

  // Public-safe projection: no raw payment refs, no full address
  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      items: order.items.map((i) => ({
        name: i.name,
        slug: i.slug,
        image: i.image,
        size: i.size,
        qty: i.qty,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount ?? 0,
      couponCode: order.coupon?.code,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      maskedEmail: maskEmail(order.email),
      provider: order.provider,
      paymentMethod: order.paymentMethod ?? "online",
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
      invoiceNumber: order.invoiceNumber,
      shipCity: order.address?.city,
      returnStatus: order.returnStatus,
      refundStatus: order.refundStatus,
      cancelReason: order.cancelReason,
    },
    events: getEvents(order.id),
    steps: TRACKING_STEPS,
  });
}
