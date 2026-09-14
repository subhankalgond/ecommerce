import type { Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

/**
 * Order notifications to the store admin.
 *
 *  - WhatsApp: free via CallMeBot (api.callmebot.com). You message their bot
 *    once from your WhatsApp to get an API key, then every order arrives in
 *    your own WhatsApp — no Meta business account needed.
 *  - Email: free tier of Resend (resend.com). Works from day one with their
 *    onboarding@resend.dev sender; add your own domain later.
 *
 * Both channels are optional and failure is never surfaced to the buyer —
 * a notification problem must not break a completed payment.
 */

function digitsOnly(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** a value counts as configured only if it's non-empty and not a template placeholder */
function isReal(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return !/your|here|change_me|example\.com/i.test(v);
}

export function notifyConfigured(): {
  whatsapp: boolean;
  email: boolean;
  adminEmail: boolean;
} {
  return {
    whatsapp: Boolean(
      digitsOnly(process.env.ADMIN_WHATSAPP_NUMBER) && isReal(process.env.CALLMEBOT_APIKEY)
    ),
    /** customer receipts only need RESEND_API_KEY */
    email: isReal(process.env.RESEND_API_KEY),
    /** the internal "new order" alert needs the admin's own address too */
    adminEmail: isReal(process.env.RESEND_API_KEY) && isReal(process.env.ADMIN_EMAIL),
  };
}

async function sendWhatsApp(text: string): Promise<void> {
  const phone = digitsOnly(process.env.ADMIN_WHATSAPP_NUMBER);
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) return;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    phone
  )}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`CallMeBot responded ${res.status}`);
  }
}

/**
 * Raw Resend send to any address. Used for both admin alerts and
 * customer confirmations. Throws on failure — callers decide severity.
 */
async function sendToEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !isReal(apiKey)) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Nova Threads <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status} ${detail.slice(0, 200)}`);
  }
}

/** Exported so the /api/notify/test endpoint can verify delivery. */
export async function sendAdminEmail(subject: string, html: string): Promise<void> {
  const to = process.env.ADMIN_EMAIL;
  if (!to || !isReal(to)) return;
  await sendToEmail(to, subject, html);
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function orderText(order: Order): string {
  const lines = order.items
    .map(
      (i) =>
        `• ${i.name} — size ${i.size} × ${i.qty} (${formatPrice(
          i.price * i.qty
        )})`
    )
    .join("\n");
  return [
    `🛍️ New order ${order.id}`,
    ``,
    lines,
    ``,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Shipping: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}`,
    `Total: ${formatPrice(order.total)}`,
    `Paid via: ${order.provider}`,
    `Customer: ${order.email}`,
  ].join("\n");
}

function orderHtml(order: Order): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px 6px 0">${i.name}<br/><small style="color:#666">size ${i.size} × ${i.qty}</small></td><td style="padding:6px 0;text-align:right">${formatPrice(
          i.price * i.qty
        )}</td></tr>`
    )
    .join("");
  return `
  <div style="font-family:sans-serif;max-width:520px">
    <h2>New order ${order.id}</h2>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="border-top:1px solid #ddd;padding-top:8px">
      Subtotal: ${formatPrice(order.subtotal)}<br/>
      Shipping: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}<br/>
      <strong>Total: ${formatPrice(order.total)}</strong><br/>
      Paid via: ${order.provider}<br/>
      Customer: ${order.email}
    </p>
    <p><a href="${siteUrl()}/track?order=${order.id}">Track order</a> · manage it in <a href="${siteUrl()}/admin">/admin</a></p>
  </div>`;
}

/** Customer-facing order confirmation (goes to the buyer's email). */
function customerConfirmationHtml(order: Order): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0">${i.name}<br/><small style="color:#666">Size ${i.size} · Qty ${i.qty}</small></td><td style="padding:8px 0;text-align:right">${formatPrice(
          i.price * i.qty
        )}</td></tr>`
    )
    .join("");
  const payLine =
    order.paymentMethod === "cod"
      ? `Payment method: <strong>Cash on Delivery</strong> — please keep ${formatPrice(order.total)} ready`
      : `Paid via ${order.provider === "stripe" ? "card (Stripe)" : "Razorpay"} ✓`;
  const addr = order.address
    ? `<p style="color:#666;font-size:13px">Delivering to: ${order.address.fullName}, ${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}</p>`
    : "";
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto">
    <h2 style="margin-bottom:4px">Thanks for your order! 🎉</h2>
    <p style="margin-top:0;color:#666">Hi${order.address?.fullName ? ` ${order.address.fullName.split(" ")[0]}` : ""}, we've received your order and it's being processed.</p>
    <div style="border:1px solid #ddd;border-radius:10px;padding:14px;margin:16px 0">
      <p style="margin:0 0 4px"><span style="color:#666;font-size:13px">Order ID:</span> <strong style="font-size:16px">${order.id}</strong></p>
      <p style="margin:0;color:#666;font-size:13px">Invoice: ${order.invoiceNumber ?? "—"}</p>
      ${order.estimatedDelivery ? `<p style="margin:4px 0 0;color:#666;font-size:13px">Estimated delivery: <strong>${new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong></p>` : ""}
    </div>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="border-top:1px solid #ddd;padding-top:8px">
      Subtotal: ${formatPrice(order.subtotal)}<br/>
      ${order.discount > 0 ? `Coupon ${order.coupon?.code ?? ""}: −${formatPrice(order.discount)}<br/>` : ""}
      Shipping: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}<br/>
      <strong>Total: ${formatPrice(order.total)}</strong><br/>
      ${payLine}
    </p>
    ${addr}
    <p style="margin-top:16px">
      <a href="${siteUrl()}/track?order=${order.id}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px">Track your order</a>
    </p>
    <p style="color:#999;font-size:12px">You can cancel free of charge until your order ships. Need help? Just reply to this email.</p>
  </div>`;
}

/**
 * Order confirmation email to the CUSTOMER (the email they entered at
 * checkout). This is the PRIMARY order email. Never throws; returns whether
 * the send succeeded.
 */
export async function sendCustomerConfirmation(order: Order): Promise<boolean> {
  if (!order.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    return false;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!isReal(apiKey)) {
    console.warn("[notify] customer confirmation skipped — RESEND_API_KEY not set");
    return false;
  }
  try {
    await sendToEmail(
      order.email,
      `Order confirmed — ${order.id} 🛍️`,
      customerConfirmationHtml(order)
    );
    return true;
  } catch (err) {
    console.error("[notify] customer confirmation failed:", err);
    return false;
  }
}

/**
 * Fire ALL notifications for a new order.
 *
 *   1. Customer confirmation → the email the buyer entered at checkout
 *      (PRIMARY — needs just RESEND_API_KEY).
 *   2. Admin "new order" alert → ADMIN_EMAIL (only when it is configured,
 *      so an unset admin address never blocks or fails the customer email).
 *
 * Never throws — problems are logged and reported in the returned flags.
 */
export async function notifyNewOrder(order: Order): Promise<{
  customerEmailSent: boolean;
  adminEmailSent: boolean;
  whatsappSent: boolean;
}> {
  const config = notifyConfigured();

  // customer receipt first — this is the email that matters to the buyer
  const results = await Promise.allSettled([
    sendCustomerConfirmation(order),
    config.adminEmail
      ? sendAdminEmail(`🛍️ New order ${order.id} — ${formatPrice(order.total)}`, orderHtml(order))
      : Promise.resolve(false),
    config.whatsapp ? sendWhatsApp(orderText(order)) : Promise.resolve(false),
  ]);

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[notify] order notification failed:", r.reason);
    }
  }

  return {
    customerEmailSent:
      results[0].status === "fulfilled" && results[0].value === true,
    adminEmailSent:
      results[1].status === "fulfilled" && results[1].value === true,
    whatsappSent:
      results[2].status === "fulfilled" && results[2].value === true,
  };
}
