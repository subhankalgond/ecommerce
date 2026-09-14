"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "@/lib/order-types";
import type { CouponDef } from "@/lib/coupons";

/** Mirrors PublicAdmin/ROLE_LABELS from src/lib/admin-users.ts (kept local —
 * the server lib uses node:fs and must never ship to the browser). */
type AdminRole = "super" | "products" | "orders" | "support";
interface PublicAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLoginAt?: string;
}
const ROLE_LABELS: Record<AdminRole, string> = {
  super: "Super Admin",
  products: "Product Manager",
  orders: "Order Manager",
  support: "Support Staff",
};

/** Which tabs each role can open (mirrors SECTION_ACCESS server-side). */
const SECTION_ACCESS: Record<string, AdminRole[]> = {
  dashboard: ["super", "products", "orders", "support"],
  orders: ["super", "orders", "support"],
  products: ["super", "products"],
  inventory: ["super", "products"],
  customers: ["super", "support", "orders"],
  coupons: ["super"],
  settings: ["super"],
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

function money(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

type Tab =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "coupons"
  | "customers"
  | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "inventory", label: "Inventory" },
  { id: "customers", label: "Customers" },
  { id: "coupons", label: "Coupons" },
  { id: "settings", label: "Settings ⚙️" },
];

interface Stats {
  todaySales: number;
  ordersToday: number;
  ordersTotal: number;
  customers: number;
  lowStockCount: number;
  days: { date: string; total: number }[];
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  lowStock: { id: string; name: string; qty: number }[];
  outOfStock: { id: string; name: string; qty: number }[];
  statusCounts: Record<string, number>;
  recentOrders: Order[];
}

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  sizes: string[];
  colors: string[];
  image: string;
  tags: string[];
  featured?: boolean;
  active?: boolean;
  stock: number | null;
  rating: { count: number; average: number };
}

interface CustomerRow {
  email: string;
  name: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  blocked: boolean;
}

function LoginGate({
  adminEmailHint,
  onDone,
}: {
  adminEmailHint: string | null;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
      } else {
        onDone();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24">
      <p className="text-4xl">🛠️</p>
      <h1 className="mt-4 text-2xl font-bold">Admin sign in</h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        Staff access only — customers sign in at{" "}
        <Link href="/login" className="font-semibold underline underline-offset-2">
          /login
        </Link>
        .
      </p>
      <form
        className="mt-8 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          autoComplete="email"
          autoFocus
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="mt-3 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="mt-4 w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-neutral-400">
        {adminEmailHint ? (
          <>
            First time? Sign in as <span className="font-mono">{adminEmailHint}</span> with
            the <span className="font-mono">ADMIN_PASSWORD</span> from your{" "}
            <span className="font-mono">.env</span>.
          </>
        ) : (
          <>
            Set <span className="font-mono">ADMIN_EMAIL</span> +{" "}
            <span className="font-mono">ADMIN_PASSWORD</span> in{" "}
            <span className="font-mono">.env</span> to create the first Super Admin.
          </>
        )}
      </p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function SalesGraph({ days }: { days: { date: string; total: number }[] }) {
  const max = Math.max(...days.map((d) => d.total), 1);
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <p className="text-sm font-semibold">Sales — last 14 days</p>
      <div className="mt-4 flex h-36 items-end gap-1.5">
        {days.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-neutral-900/80 transition group-hover:bg-neutral-900"
              style={{ height: `${Math.max((d.total / max) * 128, 2)}px` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white group-hover:block">
              {d.date.slice(5)} · {money(d.total)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
        <span>{days[0]?.date.slice(5)}</span>
        <span>{days[days.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  initialAuthed,
  initialAdmin,
  adminEmailHint,
}: {
  initialAuthed: boolean;
  initialAdmin: PublicAdmin | null;
  adminEmailHint: string | null;
}) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [me, setMe] = useState<PublicAdmin | null>(initialAdmin);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<(Order & { customerBlocked?: boolean })[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [coupons, setCoupons] = useState<CouponDef[] | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = (await res.json()) as { orders?: (Order & { customerBlocked?: boolean })[] };
    setOrders(data.orders ?? []);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = (await res.json()) as Stats;
      setStats(data);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (res.ok) {
      const data = (await res.json()) as { products?: AdminProduct[] };
      setProducts(data.products ?? []);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) {
      const data = (await res.json()) as { coupons?: CouponDef[] };
      setCoupons(data.coupons ?? []);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    const res = await fetch("/api/admin/customers");
    if (res.ok) {
      const data = (await res.json()) as { customers?: CustomerRow[] };
      setCustomers(data.customers ?? []);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    void load();
    void loadStats();
  }, [authed, load, loadStats]);

  // Keep the signed-in admin identity fresh (name/role can change in Settings)
  useEffect(() => {
    if (!authed) return;
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { me?: PublicAdmin } | null) => {
        if (d?.me) setMe(d.me);
      })
      .catch(() => {});
  }, [authed, tab]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "products" || tab === "inventory") void loadProducts();
    if (tab === "coupons") void loadCoupons();
    if (tab === "customers") void loadCustomers();
  }, [authed, tab, loadProducts, loadCoupons, loadCustomers]);

  const setStatus = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { order?: Order };
        setOrders((prev) =>
          prev
            ? prev.map((o) => (o.id === data.order?.id ? { ...o, ...data.order! } : o))
            : prev
        );
        void loadStats();
      }
    } finally {
      setBusyId(null);
    }
  };

  const saveShipment = async (id: string, courier: string, trackingNumber: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, shipment: { courier, trackingNumber } }),
      });
      if (res.ok) {
        const data = (await res.json()) as { order?: Order };
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === id ? { ...o, ...data.order! } : o)) : prev
        );
        notify("Shipment info saved");
      }
    } finally {
      setBusyId(null);
    }
  };

  const decideReturn = async (id: string, decision: "approved" | "rejected" | "refunded") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, returnDecision: decision }),
      });
      if (res.ok) {
        const data = (await res.json()) as { order?: Order };
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === id ? { ...o, ...data.order! } : o)) : prev
        );
        notify(`Return ${decision}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  if (!authed) {
    return (      <LoginGate adminEmailHint={adminEmailHint} onDone={() => {
          setAuthed(true);
        }}
      />
    );
  }

  const all = orders ?? [];
  const filtered = all.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Store admin</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {all.length} orders · {money(all.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0))} revenue (excl. cancelled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {me && (
            <div className="hidden items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {me.name.charAt(0).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold">{me.name}</p>
                <p className="text-[10px] text-neutral-500">{ROLE_LABELS[me.role]}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              void load();
              void loadStats();
              notify("Refreshed");
            }}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              setAuthed(false);
              setMe(null);
              setOrders(null);
            }}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.filter((t) => me === null || SECTION_ACCESS[t.id]?.includes(me.role)).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t.label}
            {t.id === "inventory" && stats && stats.lowStockCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                {stats.lowStockCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Dashboard ─────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Today's sales" value={money(stats?.todaySales ?? 0)} hint={`${stats?.ordersToday ?? 0} orders today`} />
            <StatCard label="Orders" value={String(stats?.ordersTotal ?? 0)} />
            <StatCard label="Customers" value={String(stats?.customers ?? 0)} />
            <StatCard label="Low stock" value={String(stats?.lowStockCount ?? 0)} hint="items at ≤5 or 0" />
            <StatCard
              label="Pending action"
              value={String((stats?.statusCounts.placed ?? 0) + (stats?.statusCounts.confirmed ?? 0))}
              hint="orders awaiting packing/shipping"
            />
          </div>

          {stats && (
            <div className="grid gap-6 lg:grid-cols-2">
              <SalesGraph days={stats.days} />

              <div className="rounded-2xl border border-neutral-200 p-5">
                <p className="text-sm font-semibold">Order status overview</p>
                <div className="mt-3 space-y-2">
                  {ORDER_STATUSES.map((s) => {
                    const count = stats.statusCounts[s] ?? 0;
                    const pct = all.length ? Math.round((count / all.length) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className={`w-28 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold uppercase ${STATUS_STYLES[s]}`}>
                          {s}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                          <div className="h-full rounded-full bg-neutral-900" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-sm font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-5">
                <p className="text-sm font-semibold">Top products</p>
                {stats.topProducts.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-400">No sales data yet.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {stats.topProducts.map((p, i) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                          <span className="mr-2 text-neutral-400">#{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="shrink-0 text-neutral-500">
                          {p.qty} sold · {money(p.revenue)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 p-5">
                <p className="text-sm font-semibold">Stock alerts</p>
                {stats.lowStock.length === 0 && stats.outOfStock.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-400">All stocked products are healthy.</p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {stats.lowStock.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span className="min-w-0 truncate">{p.name}</span>
                        <span className="shrink-0 font-semibold text-amber-600">{p.qty} left</span>
                      </li>
                    ))}
                    {stats.outOfStock.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span className="min-w-0 truncate">{p.name}</span>
                        <span className="shrink-0 font-semibold text-rose-600">Out of stock</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setTab("inventory")}
                  className="mt-4 text-sm font-medium text-neutral-900 underline underline-offset-4"
                >
                  Manage inventory →
                </button>
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent orders</p>
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="text-sm font-medium text-neutral-900 underline underline-offset-4"
              >
                View all →
              </button>
            </div>
            <ul className="mt-3 divide-y divide-neutral-100">
              {(stats?.recentOrders ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  <span className="min-w-0 flex-1 truncate text-neutral-500">{o.email}</span>
                  <span className="font-semibold">{money(o.total, o.currency)}</span>
                </li>
              ))}
              {(stats?.recentOrders ?? []).length === 0 && (
                <li className="py-3 text-sm text-neutral-400">No orders yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ── Orders ────────────────────────────────────────────────────── */}
      {tab === "orders" && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or email"
              className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {orders === null ? (
            <div className="mt-8 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-3 text-lg font-medium">
                {all.length === 0 ? "No orders yet" : "No orders match this filter"}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filtered.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <div key={order.id} className="rounded-xl border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-neutral-50"
                    >
                      <span className="font-mono text-sm font-bold">{order.id}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[order.status] ?? "bg-neutral-100"}`}>
                        {order.status}
                      </span>
                      {order.paymentMethod === "cod" && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">COD</span>
                      )}
                      {order.customerBlocked && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">blocked</span>
                      )}
                      {order.returnStatus && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">return {order.returnStatus}</span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-600">
                        {order.email}
                      </span>
                      <span className="text-sm text-neutral-500">
                        {order.items.reduce((s, i) => s + i.qty, 0)} items
                      </span>
                      <span className="text-sm font-semibold">
                        {money(order.total, order.currency)}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-neutral-400">{isOpen ? "▴" : "▾"}</span>
                    </button>

                    {isOpen && (
                      <OrderDetails
                        order={order}
                        busy={busyId === order.id}
                        onStatus={(s) => void setStatus(order.id, s)}
                        onShipment={(c, t) => void saveShipment(order.id, c, t)}
                        onReturn={(d) => void decideReturn(order.id, d)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Products ──────────────────────────────────────────────────── */}
      {tab === "products" && (
        <ProductsTab products={products} reload={loadProducts} notify={notify} />
      )}

      {/* ── Inventory ─────────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <InventoryTab products={products} reload={loadProducts} notify={notify} />
      )}

      {/* ── Coupons ───────────────────────────────────────────────────── */}
      {tab === "coupons" && (
        <CouponsTab coupons={coupons} reload={loadCoupons} notify={notify} />
      )}

      {/* ── Customers ─────────────────────────────────────────────────── */}
      {tab === "customers" && (
        <CustomersTab customers={customers} reload={loadCustomers} notify={notify} />
      )}

      {/* ── Settings (Super Admin) ──────────────────────────────────── */}
      {tab === "settings" && me !== null && <SettingsTab me={me} onMe={setMe} />}
    </div>
  );
}

/* ── Settings: your account, admin team (roles), activity log ─────────── */

interface ActivityEntry {
  at: string;
  admin: string;
  action: string;
  detail?: string;
}

function SettingsTab({ me, onMe }: { me: PublicAdmin; onMe: (m: PublicAdmin) => void }) {
  const [team, setTeam] = useState<PublicAdmin[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [form, setForm] = useState({ name: "", email: "", role: "orders", password: "" });
  const [own, setOwn] = useState({ name: me.name, current: "", next: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = (await res.json()) as {
        team?: PublicAdmin[];
        activity?: ActivityEntry[];
      };
      setTeam(data.team ?? []);
      setActivity(data.activity ?? []);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const post = async (body: Record<string, unknown>, okMsg: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; team?: PublicAdmin[]; me?: PublicAdmin };
      if (!res.ok) {
        flash(false, data.error ?? "Something went wrong.");
        return false;
      }
      if (data.team) setTeam(data.team);
      if (data.me) onMe(data.me);
      flash(true, okMsg);
      return true;
    } catch {
      flash(false, "Network error — please try again.");
      return false;
    }
  };

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none";

  return (
    <div className="mt-8 space-y-8">
      {msg && (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Your account */}
      <section className="rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">Your account</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {me.email} · {ROLE_LABELS[me.role]}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            className={input}
            defaultValue={me.name}
            onChange={(e) => setOwn({ ...own, name: e.target.value })}
            placeholder="Display name"
          />
          <input
            className={input}
            type="password"
            value={own.current}
            onChange={(e) => setOwn({ ...own, current: e.target.value })}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <input
            className={input}
            type="password"
            value={own.next}
            onChange={(e) => setOwn({ ...own, next: e.target.value })}
            placeholder="New password (min 6)"
            autoComplete="new-password"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void post({ action: "update-profile", name: own.name || me.name }, "Name updated ✓")}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Save name
          </button>
          <button
            type="button"
            onClick={() => {
              void post(
                { action: "change-password", current: own.current, next: own.next },
                "Password changed ✓"
              ).then((ok) => {
                if (ok) setOwn({ ...own, current: "", next: "" });
              });
            }}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Change password
          </button>
        </div>
      </section>

      {/* Admin team */}
      <section className="rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">Admin team</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every admin signs in at <span className="font-mono">/admin</span> with their own email
          and password. Roles decide which tabs they see.
        </p>
        <div className="mt-4 divide-y divide-neutral-100">
          {team.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {a.name}
                  {a.id === me.id && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {a.email}
                  {a.lastLoginAt
                    ? ` · last login ${new Date(a.lastLoginAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : " · never signed in"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={a.role}
                  disabled={a.id === me.id}
                  onChange={(e) => void post({ action: "change-role", id: a.id, role: e.target.value }, "Role updated ✓")}
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={a.id === me.id}
                  onClick={() => {
                    if (window.confirm(`Remove ${a.name}'s admin access?`)) {
                      void post({ action: "remove", id: a.id }, "Admin removed ✓");
                    }
                  }}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-neutral-50 p-4">
          <p className="text-sm font-semibold">Add an admin</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <input
              className={input}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={input}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {(["products", "orders", "support", "super"] as const).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <input
              className={input}
              type="password"
              placeholder="Temp password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void post({ action: "invite", ...form }, "Admin added ✓").then((ok) => {
                if (ok) setForm({ name: "", email: "", role: "orders", password: "" });
              });
            }}
            className="mt-3 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            + Add admin
          </button>
        </div>
      </section>

      {/* Activity log */}
      <section className="rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">Recent activity</h2>
        <div className="mt-3 divide-y divide-neutral-100 text-sm">
          {activity.length === 0 && (
            <p className="py-3 text-neutral-500">No activity recorded yet.</p>
          )}
          {activity.map((a, i) => (
            <div key={i} className="flex flex-wrap justify-between gap-2 py-2.5">
              <p>
                <span className="font-semibold">{a.admin}</span> — {a.action}
                {a.detail ? <span className="text-neutral-500"> · {a.detail}</span> : null}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(a.at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Order details (expanded row) ─────────────────────────────────────── */

function OrderDetails({
  order,
  busy,
  onStatus,
  onShipment,
  onReturn,
}: {
  order: Order & { customerBlocked?: boolean };
  busy: boolean;
  onStatus: (s: OrderStatus) => void;
  onShipment: (courier: string, tracking: string) => void;
  onReturn: (d: "approved" | "rejected" | "refunded") => void;
}) {
  const [courier, setCourier] = useState(order.courier ?? "Delhivery");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");

  return (
    <div className="border-t border-neutral-200 px-4 py-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    Size {item.size} · Qty {item.qty} · {money(item.price, order.currency)} each
                  </p>
                </div>
                <p className="text-sm font-medium">{money(item.price * item.qty, order.currency)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{money(order.subtotal, order.currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Coupon {order.coupon?.code}</dt>
                <dd>−{money(order.discount, order.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : money(order.shipping, order.currency)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{money(order.total, order.currency)}</dd>
            </div>
          </dl>

          {/* Shipping address */}
          {order.address && (
            <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-900">Ship to</p>
              <p>{order.address.fullName} · {order.address.phone}</p>
              <p>
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
              </p>
              <p>
                {order.address.city}, {order.address.state} {order.address.pincode}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">Details</p>
            <p className="mt-1 text-neutral-600">
              {order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : `Paid via ${order.provider === "stripe" ? "Stripe" : "Razorpay"}`}
            </p>
            {order.cancelReason && (
              <p className="mt-1 text-rose-600">Cancelled: {order.cancelReason}</p>
            )}
            <p className="text-neutral-600">
              Updated{" "}
              {new Date(order.updatedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div>
            <label htmlFor={`status-${order.id}`} className="font-semibold">
              Update status
            </label>
            <select
              id={`status-${order.id}`}
              value={order.status}
              disabled={busy}
              onChange={(e) => onStatus(e.target.value as OrderStatus)}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none disabled:opacity-50"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-semibold">Shipment info</p>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            >
              {["Delhivery", "Blue Dart", "DTDC", "Ekart", "India Post", "Shiprocket"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Tracking number"
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !tracking.trim()}
              onClick={() => onShipment(courier, tracking.trim())}
              className="mt-2 w-full rounded-lg bg-neutral-900 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Save shipment info
            </button>
          </div>

          {order.returnStatus === "requested" && (
            <div>
              <p className="font-semibold">Return request</p>
              <p className="mt-1 text-xs text-neutral-500">Reason: {order.returnReason}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReturn("approved")}
                  className="flex-1 rounded-lg border border-emerald-300 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReturn("rejected")}
                  className="flex-1 rounded-lg border border-rose-300 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Reject
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReturn("refunded")}
                className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Mark refunded
              </button>
            </div>
          )}

          <Link
            href={`/track?order=${order.id}`}
            className="inline-block text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            View customer tracking page →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Products tab ─────────────────────────────────────────────────────── */

function ProductsTab({
  products,
  reload,
  notify,
}: {
  products: AdminProduct[] | null;
  reload: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [category, setCategory] = useState("men");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Black, White");
  const [images, setImages] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: `${name} — added via admin.`,
          price: Math.round(Number(price) * 100),
          compareAtPrice: compareAt ? Math.round(Number(compareAt) * 100) : undefined,
          category,
          sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
          colors: colors.split(",").map((s) => s.trim()).filter(Boolean),
          images: images.split(",").map((s) => s.trim()).filter(Boolean),
          tags: tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
          featured,
        }),
      });
      if (res.ok) {
        notify(`Product "${name}" created`);
        setShowForm(false);
        setName(""); setPrice(""); setCompareAt(""); setImages(""); setTags(""); setFeatured(false);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (p: AdminProduct) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, patch: { featured: !p.featured } }),
    });
    await reload();
  };

  const toggleDisable = async (p: AdminProduct) => {
    const disabled = p.active === false;
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, disable: !disabled }),
    });
    if (res.ok) notify(`${p.name} ${disabled ? "enabled" : "disabled"}`);
    await reload();
  };

  const setPriceFor = async (p: AdminProduct, rupees: string) => {
    const v = Number(rupees);
    if (!v || v <= 0) return;
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, patch: { price: Math.round(v * 100) } }),
    });
    notify(`${p.name} price updated`);
    await reload();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{products?.length ?? "…"} products</p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {showForm ? "Close" : "+ Add product"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 p-5 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name *" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:col-span-2" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price in ₹ *" inputMode="numeric" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Original price ₹ (for sale)" inputMode="numeric" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="Sizes (comma separated)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Colours (comma separated)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags: t-shirts, jeans…" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input value={images} onChange={(e) => setImages(e.target.value)} placeholder="Image URLs (comma separated, first = main)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Mark as featured
          </label>
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy || !name || !price}
            className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 sm:col-span-2"
          >
            {busy ? "Creating…" : "Create product"}
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-neutral-100">
                      {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="32px" />}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{p.category}</td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={Math.round(p.price / 100)}
                    onBlur={(e) => {
                      const v = String(Math.round(p.price / 100));
                      if (e.target.value !== v) void setPriceFor(p, e.target.value);
                    }}
                    className="w-20 rounded border border-neutral-200 px-2 py-1 text-sm"
                    title="Edit price in ₹"
                  />
                </td>
                <td className="px-4 py-3">
                  {p.rating.count > 0 ? `${p.rating.average} ★ (${p.rating.count})` : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleFeatured(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${p.featured ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-500"}`}
                  >
                    {p.featured ? "Featured" : "Normal"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/products/${p.slug}`} className="text-xs text-neutral-500 underline">View</Link>
                    <button
                      type="button"
                      onClick={() => void toggleDisable(p)}
                      className={`text-xs underline ${p.active === false ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {p.active === false ? "Enable" : "Disable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Inventory tab ────────────────────────────────────────────────────── */

function InventoryTab({
  products,
  reload,
  notify,
}: {
  products: AdminProduct[] | null;
  reload: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const adjust = async (id: string, delta: number) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stockDelta: delta }),
    });
    await reload();
  };

  const setStock = async (id: string, value: string) => {
    const v = Number(value);
    if (Number.isNaN(v) || v < 0) return;
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, setStock: Math.round(v) }),
    });
    notify("Stock updated");
    await reload();
  };

  const tracked = (products ?? []).filter((p) => p.stock !== null);
  const untracked = (products ?? []).filter((p) => p.stock === null);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <p className="text-xs uppercase text-neutral-400">Tracked SKUs</p>
          <p className="mt-1 text-xl font-bold">{tracked.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase text-amber-600">Low stock (≤5)</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{tracked.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase text-rose-600">Out of stock</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{tracked.filter((p) => p.stock === 0).length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Current stock</th>
              <th className="px-4 py-3">Adjust</th>
              <th className="px-4 py-3">Set</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tracked.map((p) => (
              <tr key={p.id} className={p.stock === 0 ? "bg-rose-50/50" : (p.stock ?? 0) <= 5 ? "bg-amber-50/50" : ""}>
                <td className="px-4 py-3 font-mono text-xs">NT-{p.id.toUpperCase()}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? (
                    <span className="font-bold text-rose-600">Out of stock</span>
                  ) : (p.stock ?? 0) <= 5 ? (
                    <span className="font-bold text-amber-600">{p.stock} (low)</span>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => void adjust(p.id, -1)} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">−1</button>
                    <button type="button" onClick={() => void adjust(p.id, 5)} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">+5</button>
                    <button type="button" onClick={() => void adjust(p.id, 10)} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">+10</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    defaultValue={p.stock ?? 0}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== p.stock) void setStock(p.id, e.target.value);
                    }}
                    className="w-20 rounded border border-neutral-200 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-neutral-500">
        {untracked.length} products have unlimited stock (not tracked). Set a stock level on any
        product to start tracking it — low-stock alerts appear on the dashboard.
      </p>
    </div>
  );
}

/* ── Coupons tab ──────────────────────────────────────────────────────── */

function CouponsTab({
  coupons,
  reload,
  notify,
}: {
  coupons: CouponDef[] | null;
  reload: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: type === "percentage" ? Number(value) : Math.round(Number(value) * 100),
          minOrder: minOrder ? Math.round(Number(minOrder) * 100) : 0,
          expiresAt: expiry || undefined,
          usageLimit: Number(usageLimit) || 100,
          category: category || undefined,
        }),
      });
      if (res.ok) {
        notify(`Coupon ${code.toUpperCase()} saved`);
        setCode(""); setValue(""); setMinOrder(""); setExpiry("");
        await reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: CouponDef) => {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c.code, active: !c.active }),
    });
    await reload();
  };

  const remove = async (c: CouponDef) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    await fetch(`/api/admin/coupons?code=${encodeURIComponent(c.code)}`, { method: "DELETE" });
    notify(`Coupon ${c.code} deleted`);
    await reload();
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 rounded-2xl border border-neutral-200 p-5 sm:grid-cols-3">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE *" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase" />
        <select value={type} onChange={(e) => setType(e.target.value as "percentage" | "fixed")} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="percentage">Percentage %</option>
          <option value="fixed">Fixed ₹</option>
        </select>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percentage" ? "10 = 10% *" : "200 = ₹200 off *"} inputMode="numeric" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Min order ₹ (optional)" inputMode="numeric" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <input value={expiry} onChange={(e) => setExpiry(e.target.value)} type="date" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Usage limit" inputMode="numeric" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="">All categories</option>
          <option value="men">Men only</option>
          <option value="women">Women only</option>
          <option value="kids">Kids only</option>
        </select>
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy || !code || !value}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Saving…" : "Create coupon"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(coupons ?? []).map((c) => (
              <tr key={c.code}>
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">
                  {c.type === "percentage" ? `${c.value}%` : money(c.value)}
                  {c.category ? ` · ${c.category} only` : ""}
                </td>
                <td className="px-4 py-3">{c.minOrder > 0 ? money(c.minOrder) : "—"}</td>
                <td className="px-4 py-3">{new Date(c.expiresAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">{c.used}/{c.usageLimit}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggle(c)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}
                  >
                    {c.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => void remove(c)} className="text-xs text-rose-600 underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Customers tab ────────────────────────────────────────────────────── */

function CustomersTab({
  customers,
  reload,
  notify,
}: {
  customers: CustomerRow[] | null;
  reload: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = (customers ?? []).filter(
    (c) =>
      !search.trim() ||
      c.email.includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBlock = async (c: CustomerRow) => {
    await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: c.email, blocked: !c.blocked }),
    });
    notify(c.blocked ? `${c.email} unblocked` : `${c.email} blocked`);
    await reload();
  };

  return (
    <div className="mt-6">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name"
        className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Last order</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((c) => (
              <tr key={c.email} className={c.blocked ? "bg-rose-50/50" : ""}>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-neutral-500">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                </td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className="px-4 py-3 font-semibold">{money(c.totalSpent)}</td>
                <td className="px-4 py-3">
                  {new Date(c.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${c.blocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {c.blocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleBlock(c)}
                    className={`text-xs underline ${c.blocked ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {c.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Customers appear here after their first order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
