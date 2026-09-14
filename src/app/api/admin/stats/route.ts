import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-users";
import { listOrders, loadStock } from "@/lib/orders";
import { allProducts } from "@/lib/product-store";
import { reviewSummary } from "@/lib/reviews";

function sameDay(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function GET() {
  if ((await currentAdmin()) === null) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orders = listOrders();
  const valid = orders.filter((o) => o.status !== "cancelled");

  const todaySales = valid
    .filter((o) => sameDay(o.createdAt))
    .reduce((s, o) => s + o.total, 0);

  // 14-day sales graph (₹ per day)
  const days: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    const total = valid
      .filter((o) => o.createdAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.total, 0);
    days.push({ date: key, total });
  }

  // top products by units sold
  const units = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of valid) {
    for (const item of o.items) {
      const cur = units.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
      cur.qty += item.qty;
      cur.revenue += item.qty * item.price;
      units.set(item.productId, cur);
    }
  }
  const topProducts = [...units.entries()]
    .map(([id, v]) => ({ id, ...v, rating: reviewSummary(id) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const stock = loadStock();
  const lowStock = Object.entries(stock)
    .filter(([, qty]) => qty > 0 && qty <= 5)
    .map(([id, qty]) => {
      const p = allProducts().find((x) => x.id === id);
      return { id, name: p?.name ?? id, qty };
    });
  const outOfStock = Object.entries(stock)
    .filter(([, qty]) => qty === 0)
    .map(([id, qty]) => {
      const p = allProducts().find((x) => x.id === id);
      return { id, name: p?.name ?? id, qty };
    });

  // order status overview
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  return NextResponse.json({
    todaySales,
    ordersToday: orders.filter((o) => sameDay(o.createdAt)).length,
    ordersTotal: orders.length,
    customers: new Set(orders.map((o) => o.email.toLowerCase()).filter(Boolean)).size,
    lowStockCount: lowStock.length + outOfStock.length,
    days,
    topProducts,
    lowStock,
    outOfStock,
    statusCounts,
    recentOrders: orders.slice(0, 5),
  });
}
