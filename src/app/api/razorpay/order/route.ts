import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { parseCart } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/order-types";

export async function POST(request: Request) {
  // 1. Check Razorpay configuration
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (
    !keyId ||
    !keySecret ||
    keyId === "rzp_test_your_key_here" ||
    keySecret === "your_key_secret_here"
  ) {
    return NextResponse.json(
      {
        error:
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env, then restart the dev server. See README.md for details.",
      },
      { status: 500 }
    );
  }

  // 2. Parse and validate the request body
  let body: {
    email?: unknown;
    items?: unknown;
    coupon?: unknown;
    delivery?: unknown;
    address?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  const addr = (body.address ?? {}) as Record<string, unknown>;
  const address: ShippingAddress = {
    fullName: typeof addr.fullName === "string" ? addr.fullName.slice(0, 100) : "",
    phone: typeof addr.phone === "string" ? addr.phone.slice(0, 20) : "",
    line1: typeof addr.line1 === "string" ? addr.line1.slice(0, 200) : "",
    line2: typeof addr.line2 === "string" ? addr.line2.slice(0, 200) : undefined,
    city: typeof addr.city === "string" ? addr.city.slice(0, 80) : "",
    state: typeof addr.state === "string" ? addr.state.slice(0, 80) : "",
    pincode: typeof addr.pincode === "string" ? addr.pincode.slice(0, 10) : "",
  };

  // 3. Re-price every line server-side — never trust client prices
  const delivery = body.delivery === "express" ? "express" : "standard";
  const coupon = typeof body.coupon === "string" ? body.coupon.trim() : undefined;
  const { cart, error } = parseCart(body.items, { couponCode: coupon, delivery });
  if (!cart) {
    return NextResponse.json({ error: error ?? "Invalid cart." }, { status: 400 });
  }

  // 4. Create the Razorpay order (amounts in paise)
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: cart.total,
      currency: "INR",
      receipt: `nt_${Date.now()}`,
      notes: {
        email,
        items: JSON.stringify(
          cart.lines.map((l) => ({
            id: l.product.id,
            size: l.size,
            qty: l.quantity,
          }))
        ),
        coupon: coupon ?? "",
        discount: String(cart.discount),
        delivery,
        address: JSON.stringify(address),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Razorpay order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
