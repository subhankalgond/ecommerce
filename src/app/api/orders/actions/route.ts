import { NextResponse } from "next/server";
import { cancelOrder, requestReturn, findOrder, isBlocked } from "@/lib/orders";

/**
 * Customer order actions, guarded by order id (treated as a bearer token —
 * the same model the /track page uses). Blocked customers cannot act.
 */
export async function POST(request: Request) {
  let body: { orderId?: unknown; action?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  if (!orderId || !action) {
    return NextResponse.json({ error: "orderId and action are required." }, { status: 400 });
  }

  const order = findOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.email && isBlocked(order.email)) {
    return NextResponse.json({ error: "This account cannot perform this action." }, { status: 403 });
  }

  if (action === "cancel") {
    if (!reason) return NextResponse.json({ error: "Please tell us why you're cancelling." }, { status: 400 });
    const updated = cancelOrder(orderId, reason);
    if (!updated) {
      return NextResponse.json(
        { error: "This order can no longer be cancelled (already shipped or delivered)." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, status: updated.status });
  }

  if (action === "return") {
    if (!reason) return NextResponse.json({ error: "Please tell us why you're returning." }, { status: 400 });
    const { order: updated, error } = requestReturn(orderId, reason);
    if (error || !updated) {
      return NextResponse.json({ error: error ?? "Could not request return." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, returnStatus: updated.returnStatus });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
