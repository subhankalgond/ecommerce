import { NextResponse } from "next/server";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { parseStoredItems, recordOrder } from "@/lib/orders";
import { getShipping } from "@/lib/store-config";
import { notifyNewOrder } from "@/lib/notify";
import { checkCoupon, couponDiscount, redeemCoupon } from "@/lib/coupons";
import type { ShippingAddress } from "@/lib/order-types";

function parseAddress(raw: unknown): ShippingAddress | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const a = JSON.parse(raw) as Record<string, unknown>;
    if (!a.fullName && !a.line1) return undefined;
    return {
      fullName: typeof a.fullName === "string" ? a.fullName : "",
      phone: typeof a.phone === "string" ? a.phone : "",
      line1: typeof a.line1 === "string" ? a.line1 : "",
      line2: typeof a.line2 === "string" ? a.line2 : undefined,
      city: typeof a.city === "string" ? a.city : "",
      state: typeof a.state === "string" ? a.state : "",
      pincode: typeof a.pincode === "string" ? a.pincode : "",
    };
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId =
    typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId =
    typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature =
    typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "Missing payment confirmation fields." },
      { status: 400 }
    );
  }

  // 1. Verify the HMAC-SHA256 signature Razorpay generated for this payment
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json(
      { error: "Payment signature verification failed." },
      { status: 400 }
    );
  }

  // 2. Double-check the payment really succeeded, directly with Razorpay
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await rzp.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      return NextResponse.json(
        { error: `Payment not captured (status: ${payment.status}).` },
        { status: 400 }
      );
    }

    // 3. Record the order (idempotent) and notify the admin on WhatsApp/email
    let savedOrderId: string | undefined;
    try {
      const rzpOrder = await rzp.orders.fetch(orderId);
      const notesItems = rzpOrder.notes?.items;
      const items = parseStoredItems(
        typeof notesItems === "string" ? notesItems : undefined
      );
      const notesEmail = rzpOrder.notes?.email;
      const email =
        typeof payment.email === "string" && payment.email
          ? payment.email
          : typeof notesEmail === "string"
            ? notesEmail
            : "";

      const couponCode =
        typeof rzpOrder.notes?.coupon === "string" && rzpOrder.notes.coupon
          ? rzpOrder.notes.coupon
          : undefined;
      const delivery =
        rzpOrder.notes?.delivery === "express" ? "express" : "standard";
      const address = parseAddress(rzpOrder.notes?.address);

      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const baseShipping = getShipping(subtotal);
      const expressFee = delivery === "express" ? 19900 : 0;
      const shipping =
        baseShipping === 0 && delivery === "standard" ? 0 : baseShipping + expressFee;

      let discount = 0;
      let coupon = undefined;
      if (couponCode && items.length > 0) {
        // category-specific coupons are validated against product categories
        const { PRODUCTS } = await import("@/lib/products");
        const categories = [
          ...new Set(
            items
              .map((i) => PRODUCTS.find((p) => p.id === i.productId)?.category)
              .filter((c) => c !== undefined)
          ),
        ];
        const check = checkCoupon(couponCode, subtotal, categories);
        if (check.ok && check.coupon) {
          discount = couponDiscount(check.coupon, subtotal);
          coupon = {
            code: check.coupon.code,
            type: check.coupon.type,
            value: check.coupon.value,
            discount,
          };
        }
      }

      const { order: saved, created } = recordOrder({
        provider: "razorpay",
        paymentRef: paymentId,
        email,
        items,
        subtotal,
        shipping,
        discount,
        coupon,
        total:
          typeof payment.amount === "number"
            ? payment.amount
            : Number(payment.amount ?? 0),
        currency: "INR",
        address,
        paymentMethod: "online",
        deliveryOption: delivery,
      });
      savedOrderId = saved.id;
      if (created) {
        if (coupon) redeemCoupon(couponCode!);
        await notifyNewOrder(saved);
      }
    } catch (err) {
      // A notification/storage problem must never fail a verified payment
      console.error("[razorpay/verify] order recording failed:", err);
    }

    return NextResponse.json({ ok: true, orderId: savedOrderId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not verify payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
