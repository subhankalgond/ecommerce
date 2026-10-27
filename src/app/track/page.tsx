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
  shipped: "Dispatched",
  "out-for-delivery": "Out For Delivery",
  delivered: "Delivered",
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
        setError(data.error ?? "Order identifier not found in database.");
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

  useEffect(() => {
    const pre = searchParams.get("order") || searchParams.get("id");
    if (pre) {
      setQuery(pre);
      void lookup(pre);
    }
  }, [searchParams, lookup]);

  const act = async (action: "cancel" | "return") => {
    if (!order) return;
    const reason = window.prompt(
      action === "cancel"
        ? "Please share your reason for cancelling:"
        : "Please share your reason for return:"
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
        setError(data.error ?? "Action could not be completed.");
      } else {
        setNotice(
          action === "cancel"
            ? "Your cancellation has been recorded. Any prepaid balance will be returned in 3–5 business days."
            : "Return request registered. Our logistics partner will contact you for pickup."
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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-[#e5dfd5] pb-6">
        <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
          Live Logistics Manifest
        </span>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
          Track Your Shipment
        </h1>
        <p className="mt-2 text-xs text-[#6b645b] leading-relaxed">
          Enter your unique order identifier (e.g. <span className="font-mono text-[#171614]">NT-4KD9P2</span>) or payment reference.
        </p>
      </div>

      {/* Query Form */}
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="NT-XXXXXX or Payment Reference"
          className="flex-1 border border-[#ded7ca] bg-white px-4 py-3 font-mono text-xs uppercase text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none transition"
          aria-label="Order ID input"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition disabled:opacity-50"
        >
          {loading ? "Locating…" : "Track"}
        </button>
      </form>

      {error && (
        <div className="mt-4 border border-[#8b5a42] bg-[#fcf9f7] p-3 text-xs text-[#8b5a42] font-medium">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 border border-[#515c4d] bg-[#f5f8f5] p-3 text-xs text-[#384035] font-medium">
          {notice}
        </div>
      )}

      {/* Result Card */}
      {order && (
        <div className="mt-8 border border-[#ded7ca] bg-[#faf8f5] p-6 sm:p-8">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ede6da] pb-4">
            <div>
              <p className="font-mono text-base font-bold text-[#171614]">{order.id}</p>
              <p className="mt-0.5 text-[11px] text-[#736c62]">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <span className="border border-[#171614] bg-[#f5f0e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#171614]">
              Status: {order.status}
            </span>
          </div>

          {/* Delivery Details */}
          {order.status !== "cancelled" && (
            <div className="mt-4 border border-[#ede6da] bg-[#f7f4ee] p-4 text-xs space-y-1.5 text-[#544e45]">
              {order.estimatedDelivery && (
                <p>
                  Estimated arrival:{" "}
                  <strong className="font-semibold text-[#171614]">
                    {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </strong>
                </p>
              )}
              {order.courier && (
                <p>
                  Carrier: <span className="font-medium text-[#171614]">{order.courier}</span>
                  {order.trackingNumber && (
                    <> · AWB / Tracking: <span className="font-mono font-medium text-[#171614]">{order.trackingNumber}</span></>
                  )}
                  {order.trackingUrl && (
                    <>
                      {" · "}
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium text-[#8b5a42] underline hover:text-[#6f4430]"
                      >
                        Carrier Portal ↗
                      </a>
                    </>
                  )}
                </p>
              )}
              {order.invoiceNumber && (
                <p>
                  Invoice: <span className="font-mono font-medium text-[#171614]">{order.invoiceNumber}</span> ·{" "}
                  <a
                    href={`/api/invoice?orderId=${encodeURIComponent(order.id)}`}
                    className="font-medium text-[#8b5a42] underline hover:text-[#6f4430]"
                  >
                    Download PDF Invoice
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Progress Timeline */}
          {order.status !== "cancelled" ? (
            <div className="mt-8">
              <ol className="flex items-center">
                {steps.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-7 w-7 items-center justify-center text-[10px] font-bold border transition ${
                            done
                              ? "border-[#171614] bg-[#171614] text-white"
                              : "border-[#d5cebf] bg-white text-[#8c857b]"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span
                          className={`mt-1.5 whitespace-nowrap text-[9px] uppercase tracking-wider ${
                            done ? "font-semibold text-[#171614]" : "text-[#9e978e]"
                          }`}
                        >
                          {STEP_LABELS[step] ?? step}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`mx-1 mb-5 h-px flex-1 ${
                            i < stepIndex ? "bg-[#171614]" : "bg-[#ded7ca]"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="mt-6 border border-[#8b5a42] bg-[#fcf9f7] p-4 text-xs text-[#8b5a42]">
              <p className="font-semibold uppercase tracking-wider">This Order Has Been Cancelled</p>
              {order.cancelReason && <p className="mt-1">Reason: {order.cancelReason}</p>}
            </div>
          )}

          {/* Status History Events */}
          {events.length > 0 && (
            <details className="mt-6 border-t border-[#ede6da] pt-4 text-xs">
              <summary className="cursor-pointer font-semibold uppercase tracking-wider text-[#8c857b] hover:text-[#171614]">
                Detailed Milestone Log ({events.length})
              </summary>
              <ul className="mt-3 space-y-2 border-l border-[#ded7ca] pl-3 text-xs text-[#544e45]">
                {events.map((ev, i) => (
                  <li key={i}>
                    <span className="font-medium text-[#171614]">{ev.label}</span>
                    {ev.note ? ` — ${ev.note}` : ""}{" "}
                    <span className="text-[10px] text-[#8c857b] ml-1">
                      ({new Date(ev.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })})
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Items Breakdown */}
          <ul className="mt-8 divide-y divide-[#ede6da] border-t border-[#ede6da] pt-4">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4 py-3">
                <div className="relative aspect-[3/4] h-16 w-12 shrink-0 overflow-hidden bg-[#ede8df] border border-[#e5dfd5]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-serif text-xs text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[#736c62]">
                    Size: {item.size} · Quantity: {item.qty}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Financial Breakdown */}
          <dl className="mt-6 space-y-2 border-t border-[#ede6da] pt-4 text-xs">
            <div className="flex justify-between text-[#615a51]">
              <dt>Garment Subtotal</dt>
              <dd>{formatMoney(order.subtotal, order.currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#8b5a42] font-medium">
                <dt>Promotional Code ({order.couponCode})</dt>
                <dd>−{formatMoney(order.discount, order.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between text-[#615a51]">
              <dt>Shipping</dt>
              <dd>{order.shipping === 0 ? "Complimentary" : formatMoney(order.shipping, order.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#ded7ca] pt-2 font-serif text-sm font-semibold text-[#171614]">
              <dt>Total Settled</dt>
              <dd>{formatMoney(order.total, order.currency)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[11px] text-[#8c857b]">
            Method: {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Gateway"} via{" "}
            {order.provider.toUpperCase()} · Associated email: {order.maskedEmail}
            {order.shipCity ? ` · Destination: ${order.shipCity}` : ""}
          </p>

          {order.returnStatus && (
            <p className="mt-3 border border-[#b8956e] bg-[#fbf8f3] p-2.5 text-xs text-[#7b542c] font-medium">
              Return status: {order.returnStatus}
              {order.refundStatus ? ` · Refund: ${order.refundStatus}` : ""}
            </p>
          )}

          {/* Self-Service Actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-[#ede6da] pt-4">
            {canCancel && (
              <button
                type="button"
                onClick={() => void act("cancel")}
                className="border border-[#8b5a42] bg-white px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#8b5a42] hover:bg-[#8b5a42] hover:text-white transition"
              >
                Cancel Order
              </button>
            )}
            {canReturn && (
              <button
                type="button"
                onClick={() => void act("return")}
                className="border border-[#171614] bg-white px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:bg-[#171614] hover:text-white transition"
              >
                Request Return
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-xs text-[#736c62]">
        Have questions regarding dispatch or sizing?{" "}
        <Link href="/support#contact" className="underline hover:text-[#171614]">
          Contact Client Care
        </Link>
        .
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-8 w-64 animate-pulse bg-[#ede8df]" />
        </div>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
