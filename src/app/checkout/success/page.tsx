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
  title: "Order confirmed",
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

  // 1. Verify the HMAC-SHA256 signature for this payment
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  // 2. Confirm the payment was captured and rebuild the order from its notes
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await rzp.payments.fetch(paymentId);
    if (payment.status !== "captured") return null;
    const order = await rzp.orders.fetch(orderId);
    // SDK types are loose (string | number for amount) — coerce defensively
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

/**
 * Record the verified payment as an order (idempotent — the Razorpay verify
 * route usually got here first) and make sure the admin was notified.
 */
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
  let paymentLabel = "Payment";

  if (params.cod === "1" && params.order_id) {
    // COD: the order already exists — just show it
    const order = findOrder(params.order_id);
    if (order) {
      orderId = order.id;
      codTotal = order.total;
      paymentLabel = "Cash on Delivery";
      summary = {
        amountTotal: order.total,
        currency: order.currency,
        lines: order.items,
        email: order.email,
      };
    }
  } else if (params.session_id) {
    paymentLabel = "Payment";
    summary = await getStripeSummary(params.session_id);
    if (summary) {
      orderId = await finalizeOrder(summary, "stripe", params.session_id);
    }
  } else if (params.rzp_payment_id && params.rzp_order_id && params.rzp_signature) {
    paymentLabel = "Payment";
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
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-6xl">🎉</p>
      <h1 className="mt-6 text-3xl font-bold">
        {codTotal !== null ? "Order placed!" : "Thank you for your order!"}
      </h1>

      {summary ? (
        <>
          <p className="mt-3 text-sm text-neutral-500">
            {codTotal !== null ? (
              <>
                Your order will be shipped to your address. Keep{" "}
                <span className="font-semibold text-neutral-900">
                  {formatPrice(codTotal ?? 0)}
                </span>{" "}
                ready to pay on delivery.
              </>
            ) : (
              <>
                {paymentLabel} of{" "}
                <span className="font-semibold text-neutral-900">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: summary.currency,
                    maximumFractionDigits: 0,
                  }).format(summary.amountTotal / 100)}
                </span>{" "}
                confirmed{summary.email ? ` — a receipt is on its way to ${summary.email}` : ""}.
              </>
            )}
          </p>

          {orderId && (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-neutral-900 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Your order ID
              </p>
              <p className="mt-1 font-mono text-2xl font-bold">{orderId}</p>
              <p className="mt-2 text-xs text-neutral-500">
                Save this — you&apos;ll use it to track your delivery.
              </p>
              <Link
                href={`/track?order=${encodeURIComponent(orderId)}`}
                className="mt-3 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                Track this order →
              </Link>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-neutral-200 p-6 text-left">
            <h2 className="font-semibold">Order summary</h2>
            {summary.lines.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {summary.lines.map((line) => (
                  <li key={`${line.slug}-${line.size}`} className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${line.image}&w=96`}
                      alt={line.name}
                      className="h-16 w-14 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${line.slug}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {line.name}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        Size {line.size} · Qty {line.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(line.price * line.qty)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Order details recorded.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          Your payment was received and your order is confirmed.
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Continue shopping
        </Link>
        <Link
          href="/track"
          className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Track order
        </Link>
      </div>
      <p className="mt-6 text-xs text-neutral-400">
        Questions? Visit our{" "}
        <Link href="/support" className="underline underline-offset-4">
          support page
        </Link>{" "}
        or track your order any time at /track.
      </p>
    </div>
  );
}
