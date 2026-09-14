import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PRODUCTS, formatPrice, type Product } from "@/lib/products";
import type {
  Order,
  OrderItem,
  OrderStatus,
  ShippingAddress,
  AppliedCoupon,
  OrderEvent,
} from "@/lib/order-types";

export type { Order, OrderItem, OrderStatus } from "@/lib/order-types";
export {
  ORDER_STATUSES,
  TRACKING_STEPS,
} from "@/lib/order-types";

/**
 * Parse the compact item list we stash in payment metadata/notes
 * ([{ id, size, qty }]) and rebuild full order lines from the catalog.
 */
export function parseStoredItems(raw: string | undefined): OrderItem[] {
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as { id?: string; size?: string; qty?: number }[];
    return items
      .map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.id);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          size: item.size ?? "—",
          qty: item.qty ?? 1,
          price: product.price,
        };
      })
      .filter((l): l is OrderItem => l !== null);
  } catch {
    return [];
  }
}

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const EVENTS_FILE = path.join(DATA_DIR, "order-events.json");
const STOCK_FILE = path.join(DATA_DIR, "stock.json");

function loadOrders(): Order[] {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

/** unambiguous alphabet (no 0/O/1/I/L) for human-readable order ids */
const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateOrderId(): string {
  const bytes = crypto.randomBytes(6);
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return `NT-${id}`;
}

export interface RecordOrderInput {
  provider: Order["provider"];
  paymentRef: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  coupon?: AppliedCoupon;
  total: number;
  currency: string;
  address?: ShippingAddress;
  paymentMethod?: "online" | "cod";
  deliveryOption?: "standard" | "express";
}

/**
 * Persist a verified order. Idempotent — if the same provider/paymentRef
 * was already recorded (e.g. the verify route ran before the success page),
 * the existing order is returned and `created` is false.
 */
export function recordOrder(
  input: RecordOrderInput
): { order: Order; created: boolean } {
  const orders = loadOrders();
  const existing = orders.find(
    (o) => o.provider === input.provider && o.paymentRef === input.paymentRef
  );
  if (existing) return { order: existing, created: false };

  const now = new Date().toISOString();
  const order: Order = {
    id: generateOrderId(),
    status: "placed",
    discount: input.discount ?? 0,
    ...input,
    invoiceNumber: `INV-${now.slice(0, 10).replace(/-/g, "")}-${generateOrderId().slice(3)}`,
    createdAt: now,
    updatedAt: now,
  };
  if (!order.estimatedDelivery) {
    order.estimatedDelivery = estimateDelivery(input.deliveryOption ?? "standard");
  }
  orders.push(order);
  saveOrders(orders);
  addEvent(order.id, "Order placed", input.paymentMethod === "cod" ? "Cash on Delivery" : undefined);
  return { order, created: true };
}

/** Estimated delivery date string (3-5 days standard, 1-2 express) */
export function estimateDelivery(option: "standard" | "express"): string {
  const days = option === "express" ? 2 : 5;
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

/** Look an order up by its NT- id or by payment reference */
export function findOrder(query: string): Order | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return loadOrders().find(
    (o) => o.id.toLowerCase() === q || o.paymentRef.toLowerCase() === q
  );
}

/** ── Order events (status history / audit trail) ─────────────────────── */

interface EventLog {
  [orderId: string]: OrderEvent[];
}

function loadEvents(): EventLog {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf8");
    return JSON.parse(raw) as EventLog;
  } catch {
    return {};
  }
}

function saveEvents(log: EventLog): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(log, null, 2), "utf8");
}

export function addEvent(orderId: string, label: string, note?: string): void {
  const log = loadEvents();
  const list = log[orderId] ?? [];
  list.push({ at: new Date().toISOString(), label, note });
  log[orderId] = list;
  saveEvents(log);
}

export function getEvents(orderId: string): OrderEvent[] {
  return loadEvents()[orderId] ?? [];
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  opts?: { note?: string; courier?: string; trackingNumber?: string; trackingUrl?: string }
): Order | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  if (!order) return undefined;
  order.status = status;
  if (opts?.courier !== undefined) order.courier = opts.courier;
  if (opts?.trackingNumber !== undefined) order.trackingNumber = opts.trackingNumber;
  if (opts?.trackingUrl !== undefined) order.trackingUrl = opts.trackingUrl;
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  addEvent(order.id, `Status: ${status}`, opts?.note);
  if (status === "confirmed") reduceStockForOrder(order);
  return order;
}

export function setShipment(
  id: string,
  courier: string,
  trackingNumber: string,
  estimatedDelivery?: string
): Order | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  if (!order) return undefined;
  order.courier = courier;
  order.trackingNumber = trackingNumber;
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  addEvent(order.id, "Shipment info added", `${courier} · ${trackingNumber}`);
  return order;
}

export function cancelOrder(id: string, reason: string): Order | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  if (!order) return undefined;
  if (["shipped", "out-for-delivery", "delivered", "cancelled"].includes(order.status)) {
    return undefined;
  }
  order.status = "cancelled";
  order.cancelReason = reason;
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = order.cancelledAt;
  saveOrders(orders);
  addEvent(order.id, "Order cancelled", reason);
  return order;
}

export function requestReturn(
  id: string,
  reason: string
): { order?: Order; error?: string } {
  const orders = loadOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  if (!order) return { error: "Order not found." };
  if (order.status !== "delivered")
    return { error: "Only delivered orders can be returned." };
  if (order.returnStatus)
    return { error: "A return was already requested for this order." };
  order.returnStatus = "requested";
  order.returnReason = reason;
  order.requestedAt = new Date().toISOString();
  order.refundStatus = "pending";
  order.updatedAt = order.requestedAt;
  saveOrders(orders);
  addEvent(order.id, "Return requested", reason);
  return { order };
}

export function setReturnDecision(
  id: string,
  decision: "approved" | "rejected" | "refunded"
): Order | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  if (!order) return undefined;
  order.returnStatus = decision;
  if (decision === "refunded") order.refundStatus = "completed";
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  addEvent(order.id, `Return ${decision}`);
  return order;
}

export function listOrders(): Order[] {
  return loadOrders().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listOrdersByEmail(email: string): Order[] {
  const e = email.trim().toLowerCase();
  if (!e) return [];
  return loadOrders()
    .filter((o) => o.email.toLowerCase() === e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** ── Inventory ───────────────────────────────────────────────────────── */

/** Per-product stock. Absent = effectively unlimited (catalog default). */
export type StockMap = Record<string, number>;

export function loadStock(): StockMap {
  try {
    const raw = fs.readFileSync(STOCK_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as StockMap) : {};
  } catch {
    return {};
  }
}

export function saveStock(stock: StockMap): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2), "utf8");
}

/** Get available stock for a product (null = unlimited / not tracked) */
export function getStock(productId: string): number | null {
  const stock = loadStock();
  return productId in stock ? stock[productId] : null;
}

export function adjustStock(productId: string, delta: number): StockMap {
  const stock = loadStock();
  const current = stock[productId] ?? 0;
  stock[productId] = Math.max(0, current + delta);
  saveStock(stock);
  return stock;
}

/** Reduce stock for confirmed orders (called on status → confirmed) */
function reduceStockForOrder(order: Order): void {
  const stock = loadStock();
  for (const item of order.items) {
    if (item.productId in stock) {
      stock[item.productId] = Math.max(0, stock[item.productId] - item.qty);
    }
  }
  saveStock(stock);
}

/** mask an email for public tracking: "su••••@gmail.com" */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const user = email.slice(0, at);
  const domain = email.slice(at);
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"•".repeat(Math.max(user.length - visible.length, 2))}${domain}`;
}

/** ── Customers (derived from orders) ─────────────────────────────────── */

export interface Customer {
  email: string;
  name: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  blocked: boolean;
}

const BLOCKED_FILE = path.join(DATA_DIR, "blocked.json");

function loadBlocked(): string[] {
  try {
    const raw = fs.readFileSync(BLOCKED_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveBlocked(emails: string[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BLOCKED_FILE, JSON.stringify(emails, null, 2), "utf8");
}

export function isBlocked(email: string): boolean {
  return loadBlocked().includes(email.trim().toLowerCase());
}

export function listCustomers(): Customer[] {
  const blocked = new Set(loadBlocked());
  const map = new Map<string, Customer>();
  for (const o of loadOrders()) {
    if (!o.email) continue;
    const email = o.email.toLowerCase();
    const name = o.address?.fullName ?? email.split("@")[0];
    const spend = o.status === "cancelled" ? 0 : o.total;
    const existing = map.get(email);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += spend;
      if (o.createdAt < existing.firstOrderAt) existing.firstOrderAt = o.createdAt;
      if (o.createdAt > existing.lastOrderAt) existing.lastOrderAt = o.createdAt;
      if (o.address?.fullName) existing.name = o.address.fullName;
      if (o.address?.phone) existing.phone = o.address.phone;
    } else {
      map.set(email, {
        email,
        name,
        phone: o.address?.phone,
        orderCount: 1,
        totalSpent: spend,
        firstOrderAt: o.createdAt,
        lastOrderAt: o.createdAt,
        blocked: blocked.has(email),
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt)
  );
}

export function setBlocked(email: string, blocked: boolean): void {
  const list = loadBlocked();
  const emailLc = email.trim().toLowerCase();
  const filtered = list.filter((e) => e !== emailLc);
  if (blocked) filtered.push(emailLc);
  saveBlocked(filtered);
}

export { formatPrice, type Product };
