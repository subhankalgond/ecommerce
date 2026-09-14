import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-users";
import {
  listOrders,
  updateOrderStatus,
  setShipment,
  cancelOrder,
  setReturnDecision,
  listCustomers,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/orders";

async function authed(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

/** List all orders (admin session required). */
export async function GET() {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const orders = listOrders();
  const blocked = new Set(
    listCustomers().filter((c) => c.blocked).map((c) => c.email)
  );
  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      customerBlocked: o.email ? blocked.has(o.email.toLowerCase()) : false,
    })),
  });
}

/**
 * Update an order (admin session required):
 * - { id, status } — change status (optionally courier/trackingNumber)
 * - { id, shipment: { courier, trackingNumber, estimatedDelivery } }
 * - { id, cancel: reason }
 * - { id, returnDecision: "approved" | "rejected" | "refunded" }
 */
export async function PATCH(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";

  // ── shipment info ────────────────────────────────────────────────────
  if (body.shipment && typeof body.shipment === "object") {
    const s = body.shipment as Record<string, unknown>;
    const courier = typeof s.courier === "string" ? s.courier.trim() : "";
    const trackingNumber = typeof s.trackingNumber === "string" ? s.trackingNumber.trim() : "";
    const estimatedDelivery = typeof s.estimatedDelivery === "string" ? s.estimatedDelivery : undefined;
    if (!courier || !trackingNumber) {
      return NextResponse.json({ error: "Courier and tracking number are required." }, { status: 400 });
    }
    const updated = setShipment(id, courier, trackingNumber, estimatedDelivery);
    if (!updated) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ok: true, order: updated });
  }

  // ── cancellation ─────────────────────────────────────────────────────
  if (typeof body.cancel === "string" && body.cancel.trim()) {
    const updated = cancelOrder(id, body.cancel.trim().slice(0, 500));
    if (!updated) {
      return NextResponse.json(
        { error: "Order not found or cannot be cancelled at this stage." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, order: updated });
  }

  // ── return decision ──────────────────────────────────────────────────
  if (
    body.returnDecision === "approved" ||
    body.returnDecision === "rejected" ||
    body.returnDecision === "refunded"
  ) {
    const updated = setReturnDecision(id, body.returnDecision);
    if (!updated) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ok: true, order: updated });
  }

  // ── status change ────────────────────────────────────────────────────
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !ORDER_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid order or status." }, { status: 400 });
  }

  const courier = typeof body.courier === "string" ? body.courier : undefined;
  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber : undefined;
  const note = typeof body.note === "string" ? body.note : undefined;

  const updated = updateOrderStatus(id, status as OrderStatus, {
    note,
    courier,
    trackingNumber,
  });
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order: updated });
}

