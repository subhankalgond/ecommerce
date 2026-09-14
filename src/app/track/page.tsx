"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface TrackItem {
  name: string;
  slug: string;
  image: string;
  size: string;
  qty: number;
}

interface TrackOrder {
  id: string;
  status: string;
  items: TrackItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  maskedEmail: string;
  provider: string;
  paymentMethod: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  shipCity?: string;
  returnStatus?: string;
  refundStatus?: string;
  cancelReason?: string;
}

interface OrderEvent {
  at: string;
  label: string;
  note?: string;
}

const STEPS = ["placed", "confirmed", "packed", "shipped", "out-for-delivery", "delivered"] as const;
const STEP_LABELS: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};
const STATUS_STYLES: Record<string, string> = {
  placed: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-cyan-100 text-cyan-800",
  shipped: "bg-indigo-100 text-indigo-800",
  "out-for-delivery": "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
};

function formatMoney(paise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function TrackInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [steps, setSteps] = useState<string[]>([...STEPS]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const lookup = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        order?: TrackOrder;
        events?: OrderEvent[];
        steps?: string[];
        error?: string;
      };
      if (!res.ok || !data.order) {
        setOrder(null);
        setEvents([]);
        setError(data.error ?? "Order lookup failed.");
      } else {
        setOrder(data.order);
        setEvents(data.events ?? []);
        if (data.steps) setSteps(data.steps);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-fill from ?order= (success page and notification emails link here)
  useEffect(() => {
    const pre = searchParams.get("order");
    if (pre) {
      setQuery(pre);
      void lookup(pre);
    }
  }, [searchParams, lookup]);

  const act = async (action: "cancel" | "return") => {
    if (!order) return;
    const reason = window.prompt(
      action === "cancel"
        ? "Why are you cancelling this order?"
        : "Why are you returning this order?"
    );
    if (!reason) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/orders/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action, reason }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Action failed.");
      } else {
        setNotice(
          action === "cancel"
            ? "Your order has been cancelled. Refunds for prepaid orders are initiated in 3–5 business days."
            : "Return requested! Our team will pick it up within 2–3 days."
        );
        await lookup(order.id);
      }
    } catch {
      setError("Network error — please try again.");
    }
  };

  const stepIndex = steps.indexOf(order?.status ?? "");
  const canCancel =
    order &&
    ["placed", "confirmed", "packed"].includes(order.status);
  const canReturn = order?.status === "delivered" && !order.returnStatus;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Track your order</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enter the order ID from your confirmation (it looks like{" "}
        <span className="font-mono">NT-4KD9P2</span>) or your payment ID.
      </p>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="NT-XXXXXX"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 font-mono text-sm uppercase focus:border-neutral-900 focus:outline-none"
          aria-label="Order ID"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Looking…" : "Track"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-bold">{order.id}</p>
              <p className="text-xs text-neutral-500">
                Placed{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Estimated delivery / courier */}
          {order.status !== "cancelled" && (
            <div className="mt-4 space-y-1 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
              {order.estimatedDelivery && (
                <p>
                  📦 Estimated delivery:{" "}
                  <span className="font-semibold text-neutral-900">
                    {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </p>
              )}
              {order.courier && (
                <p>
                  🚚 Courier: <span className="font-medium text-neutral-900">{order.courier}</span>
                  {order.trackingNumber && (
                    <>
                      {" "}· Tracking no:{" "}
                      <span className="font-mono font-medium text-neutral-900">
                        {order.trackingNumber}
                      </span>
                    </>
                  )}
                  {order.trackingUrl && (
                    <>
                      {" · "}
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium text-blue-600 underline underline-offset-2"
                      >
                        Track shipment ↗
                      </a>
                    </>
                  )}
                </p>
              )}
              {order.invoiceNumber && (
                <p>
                  🧾 Invoice <span className="font-mono">{order.invoiceNumber}</span> ·{" "}
                  <a
                    href={`/api/invoice?orderId=${encodeURIComponent(order.id)}`}
                    className="font-medium text-blue-600 underline underline-offset-2"
                  >
                    Download invoice
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Progress timeline (cancelled orders skip it) */}
          {order.status !== "cancelled" ? (
            <ol className="mt-6 flex items-center">
              {steps.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span
                        className={`mt-1 whitespace-nowrap text-[10px] ${
                          done ? "font-semibold text-neutral-900" : "text-neutral-400"
                        }`}
                      >
                        {STEP_LABELS[step] ?? step}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`mx-1.5 mb-5 h-0.5 flex-1 ${
                          i < stepIndex ? "bg-neutral-900" : "bg-neutral-200"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold">This order was cancelled</p>
              {order.cancelReason && <p className="mt-1">Reason: {order.cancelReason}</p>}
            </div>
          )}

          {/* Status history */}
          {events.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-neutral-600">
                Status history
              </summary>
              <ul className="mt-2 space-y-1 border-l-2 border-neutral-200 pl-3 text-xs text-neutral-500">
                {events.map((ev, i) => (
                  <li key={i}>
                    <span className="font-medium text-neutral-700">{ev.label}</span>
                    {ev.note ? ` — ${ev.note}` : ""}{" "}
                    <span className="text-neutral-400">
                      {new Date(ev.at).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Items */}
          <ul className="mt-6 space-y-4 border-t border-neutral-200 pt-6">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    Size {item.size} · Qty {item.qty}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatMoney(order.subtotal, order.currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Coupon {order.couponCode}</dt>
                <dd>−{formatMoney(order.discount, order.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd>
                {order.shipping === 0
                  ? "Free"
                  : formatMoney(order.shipping, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, order.currency)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-neutral-400">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid"} via{" "}
            {order.provider === "stripe" ? "Stripe" : order.provider === "razorpay" ? "Razorpay" : "COD"}
            {" · "}
            {order.maskedEmail}
            {order.shipCity ? ` · shipping to ${order.shipCity}` : ""}
          </p>

          {/* Return / refund status */}
          {order.returnStatus && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Return {order.returnStatus}
              {order.refundStatus ? ` · refund ${order.refundStatus}` : ""}
            </p>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={() => void act("cancel")}
                className="rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Cancel order
              </button>
            )}
            {canReturn && (
              <button
                type="button"
                onClick={() => void act("return")}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
              >
                Request return
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-neutral-500">
        Lost your order ID?{" "}
        <Link href="/support#contact" className="underline underline-offset-4">
          Contact support
        </Link>{" "}
        with the email you paid with.
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded bg-neutral-200" />
        </div>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
