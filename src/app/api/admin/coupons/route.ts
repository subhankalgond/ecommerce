import { NextResponse } from "next/server";
import { currentAdmin, canAccess } from "@/lib/admin-users";
import {
  loadCoupons,
  saveCoupons,
  upsertCoupon,
  deleteCoupon,
  type CouponDef,
} from "@/lib/coupons";

async function authed(): Promise<boolean> {
  const admin = await currentAdmin();
  return admin !== null && canAccess(admin.role, "coupons");
}

export async function GET() {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({ coupons: loadCoupons() });
}

/** POST — create or update a coupon */
export async function POST(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase().slice(0, 24) : "";
  const type = body.type === "fixed" ? "fixed" : "percentage";
  const value = typeof body.value === "number" ? Math.round(body.value) : 0;
  if (!code || value <= 0) {
    return NextResponse.json({ error: "Code and a positive value are required." }, { status: 400 });
  }
  if (type === "percentage" && value > 90) {
    return NextResponse.json({ error: "Percentage discounts are capped at 90%." }, { status: 400 });
  }

  const coupon: CouponDef = {
    code,
    type,
    value,
    minOrder: typeof body.minOrder === "number" ? Math.max(0, Math.round(body.minOrder)) : 0,
    expiresAt:
      typeof body.expiresAt === "string" && body.expiresAt
        ? new Date(body.expiresAt).toISOString()
        : new Date(Date.now() + 90 * 86400000).toISOString(),
    usageLimit: typeof body.usageLimit === "number" ? Math.max(1, Math.round(body.usageLimit)) : 100,
    used: typeof body.used === "number" ? Math.round(body.used) : 0,
    category:
      body.category === "men" || body.category === "women" || body.category === "kids"
        ? body.category
        : undefined,
    active: body.active !== false,
  };
  upsertCoupon(coupon);
  return NextResponse.json({ ok: true, coupon });
}

/** PATCH — toggle active flag */
export async function PATCH(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: { code?: unknown; active?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code : "";
  const coupons = loadCoupons();
  const c = coupons.find((x) => x.code === code);
  if (!c) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  c.active = body.active === true;
  saveCoupons(coupons);
  return NextResponse.json({ ok: true, coupon: c });
}

/** DELETE — remove a coupon */
export async function DELETE(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  if (!code) return NextResponse.json({ error: "code is required." }, { status: 400 });
  deleteCoupon(code);
  return NextResponse.json({ ok: true });
}
