import { findOrder, maskEmail } from "@/lib/orders";

/**
 * Simple invoice view (printable HTML → save as PDF from the browser).
 * Guarded only by the order id, matching the /track page's model.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId") ?? "";
  const order = findOrder(orderId);
  if (!order) {
    return new Response("Invoice not found.", { status: 404 });
  }

  const money = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: order.currency,
      maximumFractionDigits: 0,
    }).format(paise / 100);

  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0">${i.name}<br/><small style="color:#666">Size ${i.size} × ${i.qty}</small></td>
        <td style="padding:8px 0;text-align:right">${money(i.price)}</td>
        <td style="padding:8px 0;text-align:right">${money(i.price * i.qty)}</td>
      </tr>`
    )
    .join("");

  const addr = order.address
    ? `${order.address.fullName}<br/>${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}<br/>${order.address.city}, ${order.address.state} ${order.address.pincode}<br/>${order.address.phone}`
    : "—";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Invoice ${order.invoiceNumber ?? order.id}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#111}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;border-bottom:2px solid #111;padding:8px 0;font-size:13px}
  td{border-bottom:1px solid #ddd;font-size:14px}
  .right{text-align:right}
  .muted{color:#666;font-size:12px}
  @media print{.noprint{display:none}}
</style></head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1 style="margin:0;font-size:22px">Nova Threads</h1>
      <p class="muted">Demo store — invoice</p>
    </div>
    <div style="text-align:right">
      <p style="margin:0;font-weight:700">Invoice ${order.invoiceNumber ?? order.id}</p>
      <p class="muted">Order ${order.id}</p>
      <p class="muted">${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
  </div>

  <p style="margin-top:24px"><strong>Billed to</strong><br/>${maskEmail(order.email)}<br/><br/><strong>Shipping address</strong><br/>${addr}</p>
  <p class="muted">Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : `Prepaid via ${order.provider}`}${order.courier ? ` · Courier: ${order.courier}${order.trackingNumber ? ` (${order.trackingNumber})` : ""}` : ""}</p>

  <table style="margin-top:16px">
    <thead><tr><th>Item</th><th class="right">Price</th><th class="right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="margin-top:16px;max-width:280px;margin-left:auto">
    <tr><td>Subtotal</td><td class="right">${money(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td>Coupon ${order.coupon?.code ?? ""}</td><td class="right">−${money(order.discount)}</td></tr>` : ""}
    <tr><td>Shipping</td><td class="right">${order.shipping === 0 ? "Free" : money(order.shipping)}</td></tr>
    <tr><td style="font-weight:700;border-top:2px solid #111">Total</td><td class="right" style="font-weight:700;border-top:2px solid #111">${money(order.total)}</td></tr>
  </table>

  <p class="muted" style="margin-top:32px">This is a computer-generated invoice for a demo store; no tax is collected.</p>
  <p class="noprint"><button onclick="window.print()" style="padding:10px 20px;border-radius:999px;background:#111;color:#fff;border:0;cursor:pointer">Print / Save as PDF</button></p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
