import type { AppliedCoupon } from "@/lib/order-types";

export interface CouponDef {
  code: string;
  type: "percentage" | "fixed";
  /** percentage (0-100) or fixed amount in paise */
  value: number;
  minOrder: number;
  expiresAt: string;
  usageLimit: number;
  used: number;
  /** restrict to a product category, e.g. "men" | "women" | "kids" */
  category?: "men" | "women" | "kids";
  active: boolean;
}

const COUPONS_FILE = "coupons.json";

export const SEED_COUPONS: CouponDef[] = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrder: 99900,
    expiresAt: "2027-12-31T23:59:59.000Z",
    usageLimit: 500,
    used: 0,
    active: true,
  },
  {
    code: "FLAT200",
    type: "fixed",
    value: 20000,
    minOrder: 199900,
    expiresAt: "2027-12-31T23:59:59.000Z",
    usageLimit: 200,
    used: 0,
    active: true,
  },
  {
    code: "KIDS15",
    type: "percentage",
    value: 15,
    minOrder: 79900,
    expiresAt: "2027-12-31T23:59:59.000Z",
    usageLimit: 300,
    used: 0,
    category: "kids",
    active: true,
  },
];

function isNode(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

export function loadCoupons(): CouponDef[] {
  if (!isNode()) return [];
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const file = path.join(process.cwd(), ".data", COUPONS_FILE);
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(
        (c): c is CouponDef =>
          typeof c === "object" && c !== null && typeof (c as CouponDef).code === "string"
      );
    }
  } catch {
    // fall through to seed
  }
  return SEED_COUPONS.map((c) => ({ ...c }));
}

export function saveCoupons(coupons: CouponDef[]): void {
  if (!isNode()) return;
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, COUPONS_FILE),
    JSON.stringify(coupons, null, 2),
    "utf8"
  );
}

export function findCoupon(code: string): CouponDef | undefined {
  const c = code.trim().toUpperCase();
  return loadCoupons().find((x) => x.code === c);
}

export function upsertCoupon(coupon: CouponDef): void {
  const coupons = loadCoupons();
  const i = coupons.findIndex((c) => c.code === coupon.code);
  if (i >= 0) coupons[i] = coupon;
  else coupons.push(coupon);
  saveCoupons(coupons);
}

export function deleteCoupon(code: string): void {
  saveCoupons(loadCoupons().filter((c) => c.code !== code));
}

export interface CouponCheck {
  ok: boolean;
  error?: string;
  coupon?: CouponDef;
}

/** Validate a coupon against cart contents + subtotal (server-side pricing) */
export function checkCoupon(
  code: string,
  subtotal: number,
  categories: string[]
): CouponCheck {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, error: "Invalid coupon code." };
  if (!coupon.active) return { ok: false, error: "This coupon is no longer active." };
  if (new Date(coupon.expiresAt).getTime() < Date.now())
    return { ok: false, error: "This coupon has expired." };
  if (coupon.used >= coupon.usageLimit)
    return { ok: false, error: "This coupon has reached its usage limit." };
  if (subtotal < coupon.minOrder)
    return {
      ok: false,
      error: `Minimum order of ₹${Math.round(coupon.minOrder / 100)} required.`,
    };
  if (coupon.category && !categories.includes(coupon.category))
    return { ok: false, error: `This coupon only applies to ${coupon.category}'s items.` };

  return { ok: true, coupon };
}

/** Compute the discount in paise for a validated coupon */
export function couponDiscount(coupon: CouponDef, subtotal: number): number {
  const raw =
    coupon.type === "percentage"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;
  return Math.min(raw, subtotal);
}

export function toApplied(coupon: CouponDef, discount: number): AppliedCoupon {
  return { code: coupon.code, type: coupon.type, value: coupon.value, discount };
}

/** Increment the redemption counter when an order is placed */
export function redeemCoupon(code: string): void {
  const coupon = findCoupon(code);
  if (!coupon) return;
  coupon.used += 1;
  upsertCoupon(coupon);
}
