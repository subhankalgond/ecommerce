import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { parseCart } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/order-types";

interface RazorpayApiError {
  statusCode?: number;
  error?: {
    code?: string;
    description?: string;
    field?: string;
  };
  message?: string;
}

export async function POST(request: Request) {
  // 1. Check Razorpay configuration
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
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
    body = (await request.json()) as typeof body;
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

    // Safe notes values (Razorpay limits each value to <= 256 characters)
    const compactAddress = JSON.stringify({
      fullName: address.fullName.slice(0, 40),
      phone: address.phone.slice(0, 15),
      line1: address.line1.slice(0, 60),
      line2: (address.line2 ?? "").slice(0, 40),
      city: address.city.slice(0, 30),
      state: address.state.slice(0, 30),
      pincode: address.pincode.slice(0, 10),
    });

    const compactItems = JSON.stringify(
      cart.lines.map((l) => ({
        id: l.product.id,
        size: l.size,
        qty: l.quantity,
      }))
    );

    const order = await rzp.orders.create({
      amount: cart.total,
      currency: "INR",
      receipt: `nt_${Date.now()}`.slice(0, 40),
      notes: {
        email: email.slice(0, 100),
        items: compactItems.slice(0, 255),
        coupon: (coupon ?? "").slice(0, 30),
        discount: String(cart.discount),
        delivery,
        address: compactAddress.slice(0, 255),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err: unknown) {
    console.error("[api/razorpay/order] Error creating order:", err);
    
    let message = "Failed to create Razorpay order.";
    const rzpErr = err as RazorpayApiError;

    if (rzpErr?.statusCode === 401 || rzpErr?.error?.description?.toLowerCase().includes("authentication failed")) {
      message =
        "Razorpay Authentication Failed (HTTP 401): The Key ID or Secret in .env is invalid or expired. Check your keys at dashboard.razorpay.com → Settings → API Keys.";
    } else if (rzpErr?.error?.description) {
      message = `Razorpay error: ${rzpErr.error.description}`;
    } else if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
