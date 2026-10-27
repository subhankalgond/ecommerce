import Link from "next/link";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import { formatPrice } from "@/lib/products";
import {
  parseStoredItems,
  recordOrder,
  findOrder,
  type OrderItem,
} from "@/lib/orders";
import { getShipping } from "@/lib/store-config";
import { notifyNewOrder } from "@/lib/notify";

export const metadata = {
  title: "Order Confirmed — Nova Threads",
  description: "Verified order confirmation and dispatch timeline.",
};

interface OrderSummary {
  amountTotal: number;
  currency: string;
  lines: OrderItem[];
  email?: string;
}

const VALID_CURRENCIES = new Set(["INR", "USD"]);

async function getStripeSummary(sessionId: string): Promise<OrderSummary | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_your_key_here" || !sessionId) {
    return null;
  }
  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return null;
    return {
      amountTotal: session.amount_total ?? 0,
      currency: (session.currency ?? "inr").toUpperCase(),
      lines: parseStoredItems(session.metadata?.items),
      email: session.customer_details?.email ?? undefined,
    };
  } catch {
    return null;
  }
}

async function getRazorpaySummary(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<OrderSummary | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !orderId || !paymentId || !signature) {
    return null;
  }

  // 1. Verify the HMAC-SHA256 signature
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  // 2. Fetch capture status directly from Razorpay
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await rzp.payments.fetch(paymentId);
    if (payment.status !== "captured") return null;
    const order = await rzp.orders.fetch(orderId);
    const amount =
      typeof payment.amount === "number"
        ? payment.amount
        : Number(payment.amount ?? 0);
    const email =
      typeof payment.email === "string" && payment.email
        ? payment.email
        : undefined;
    const currency =
      typeof payment.currency === "string" &&
      VALID_CURRENCIES.has(payment.currency.toUpperCase())
        ? payment.currency.toUpperCase()
        : "INR";
    const notesItems = order.notes?.items;
    return {
      amountTotal: amount,
      currency,
      lines: parseStoredItems(typeof notesItems === "string" ? notesItems : undefined),
      email,
    };
  } catch {
    return null;
  }
}

async function finalizeOrder(
  summary: OrderSummary,
  provider: "stripe" | "razorpay",
  paymentRef: string
): Promise<string | null> {
  try {
    const subtotal = summary.lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping =
      summary.lines.length > 0
        ? getShipping(subtotal)
        : Math.max(summary.amountTotal - subtotal, 0);
    const { order, created } = recordOrder({
      provider,
      paymentRef,
      email: summary.email ?? "",
      items: summary.lines,
      subtotal,
      shipping,
      total: summary.amountTotal,
      currency: summary.currency,
    });
    if (created) await notifyNewOrder(order);
    return order.id;
  } catch (err) {
    console.error("[success] order recording failed:", err);
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  let summary: OrderSummary | null = null;
  let orderId: string | null = null;
  let codTotal: number | null = null;
  let paymentLabel = "Online Payment";

  // Check if order already recorded (idempotent lookup)
  const lookupKey = params.order_id || params.rzp_payment_id || params.session_id;
  const existing = lookupKey ? findOrder(lookupKey) : undefined;

  if (existing) {
    orderId = existing.id;
    codTotal = existing.paymentMethod === "cod" ? existing.total : null;
    paymentLabel = existing.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";
    summary = {
      amountTotal: existing.total,
      currency: existing.currency,
      lines: existing.items,
      email: existing.email,
    };
  } else if (params.session_id) {
    paymentLabel = "Stripe Payment";
    summary = await getStripeSummary(params.session_id);
    if (summary) {
      orderId = await finalizeOrder(summary, "stripe", params.session_id);
    }
  } else if (params.rzp_payment_id && params.rzp_order_id && params.rzp_signature) {
    paymentLabel = "Razorpay Payment";
    summary = await getRazorpaySummary(
      params.rzp_order_id,
      params.rzp_payment_id,
      params.rzp_signature
    );
    if (summary) {
      orderId = await finalizeOrder(
        summary,
        "razorpay",
        params.rzp_payment_id
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="border border-[#ded7ca] bg-[#faf8f5] p-8 sm:p-12 text-center">
        
        {/* Verification Checkmark */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#171614] bg-[#171614] text-[#faf8f5]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <span className="mt-6 inline-block text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
          Verified Confirmation
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#171614]">
          {codTotal !== null ? "Order Placed Successfully" : "Thank You For Your Order"}
        </h1>

        {summary ? (
          <>
            <p className="mt-3 text-xs sm:text-sm text-[#5e574e] max-w-md mx-auto leading-relaxed">
              {codTotal !== null ? (
                <>
                  Your garments have been scheduled for dispatch. Please have{" "}
                  <strong className="font-semibold text-[#171614]">
                    {formatPrice(codTotal ?? 0)}
                  </strong>{" "}
                  ready in cash for doorstep settlement.
                </>
              ) : (
                <>
                  {paymentLabel} of{" "}
                  <strong className="font-semibold text-[#171614]">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: summary.currency,
                      maximumFractionDigits: 0,
                    }).format(summary.amountTotal / 100)}
                  </strong>{" "}
                  has been verified server-side
                  {summary.email ? ` and an itemized receipt has been dispatched to ${summary.email}` : ""}.
                </>
              )}
            </p>

            {orderId && (
              <div className="mx-auto mt-8 max-w-sm border border-[#171614] bg-[#f5f1ea] p-5">
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8c857b]">
                  Unique Order Reference
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#171614]">
                  {orderId}
                </p>
                <p className="mt-2 text-[11px] text-[#615a51]">
                  Keep this ID for order tracking and customer care communications.
                </p>
                <div className="mt-4">
                  <Link
                    href={`/track?order=${encodeURIComponent(orderId)}`}
                    className="inline-block border border-[#171614] bg-[#171614] px-6 py-2 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
                  >
                    Track Shipment Status →
                  </Link>
                </div>
              </div>
            )}

            {/* Line Items Review */}
            <div className="mt-10 border border-[#e5dfd5] bg-white p-6 text-left">
              <h2 className="font-serif text-base text-[#171614] border-b border-[#ede6da] pb-3">
                Garment Manifest
              </h2>
              {summary.lines.length > 0 ? (
                <ul className="mt-4 divide-y divide-[#ede6da]">
                  {summary.lines.map((line) => (
                    <li key={`${line.slug}-${line.size}`} className="flex items-center gap-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${line.image}&w=96`}
                        alt={line.name}
                        className="h-16 w-12 object-cover border border-[#e5dfd5]"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${line.slug}`}
                          className="font-serif text-xs text-[#171614] hover:text-[#8b5a42] transition"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-[#7a7368]">
                          Size: {line.size} · Quantity: {line.qty}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#171614]">
                        {formatPrice(line.price * line.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-[#7a7368]">
                  Garment details successfully archived to order store.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-xs text-[#5e574e]">
            Your payment was confirmed and our fulfilment studio has received the order.
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/products"
            className="border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track"
            className="border border-[#ded7ca] bg-white px-7 py-3 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:border-[#171614] transition"
          >
            Track All Orders
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[#8c857b]">
          Need modifications or sizing advice? Consult our{" "}
          <Link href="/support" className="underline hover:text-[#171614]">
            Client Care Services
          </Link>{" "}
          or track delivery progress at /track.
        </p>

      </div>
    </div>
  );
}
