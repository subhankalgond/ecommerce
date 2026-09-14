import { NextResponse } from "next/server";
import Stripe from "stripe";
import { parseCart } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/order-types";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
  // 1. Check Stripe configuration
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_your_key_here") {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add your test secret key to .env as STRIPE_SECRET_KEY, then restart the dev server. See README.md for details.",
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

  // 4. Build the Stripe Checkout Session
  try {
    const stripe = new Stripe(secretKey);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "inr",
          unit_amount: l.product.price,
          product_data: {
            name: l.product.name,
            description: `Size ${l.size}`,
          },
        },
      }));

    // Match the storefront's shipping rule
    if (cart.shipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: cart.shipping,
          product_data: { name: "Shipping" },
        },
      });
    }

    // Coupons are applied as a negative line item on the session
    if (cart.discount > 0 && coupon) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: -cart.discount,
          product_data: { name: `Coupon ${coupon.toUpperCase()}` },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      currency: "inr",
      metadata: {
        provider: "stripe",
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
      success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/cart?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
