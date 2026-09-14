import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  getUserForSession,
  toPublic,
  updateProfile,
  changePassword,
  saveAddress,
  deleteAddress,
} from "@/lib/auth-users";
import { listOrdersByEmail } from "@/lib/orders";
import type { Order } from "@/lib/orders";

/** GET /api/auth/me — current customer + their order history (null if signed out) */
export async function GET() {
  const store = await cookies();
  const user = getUserForSession(store.get(CUSTOMER_COOKIE)?.value);
  if (!user) return NextResponse.json({ user: null });

  const orders: Order[] = listOrdersByEmail(user.email);
  return NextResponse.json({
    user: toPublic(user),
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      estimatedDelivery: o.estimatedDelivery,
      itemCount: o.items.reduce((s, i) => s + i.qty, 0),
      items: o.items.slice(0, 4).map((i) => ({
        name: i.name,
        image: i.image,
        slug: i.slug,
        size: i.size,
        qty: i.qty,
      })),
    })),
  });
}

/** PATCH /api/auth/me — update profile name/phone */
export async function PATCH(request: Request) {
  const store = await cookies();
  const user = getUserForSession(store.get(CUSTOMER_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body: { name?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const updated = updateProfile(user.id, {
    name: typeof body.name === "string" ? body.name : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  });
  return NextResponse.json({ ok: true, user: updated });
}

/** POST /api/auth/me — actions: change-password / save-address / delete-address */
export async function POST(request: Request) {
  const store = await cookies();
  const user = getUserForSession(store.get(CUSTOMER_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body: {
    action?: unknown;
    current?: unknown;
    next?: unknown;
    address?: unknown;
    addressId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action === "change-password") {
    const result = changePassword(
      user.id,
      typeof body.current === "string" ? body.current : "",
      typeof body.next === "string" ? body.next : ""
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save-address") {
    const a = (body.address ?? {}) as Record<string, unknown>;
    const str = (v: unknown, max: number) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";
    const address = {
      id: typeof a.id === "string" ? a.id : undefined,
      label: str(a.label, 40) || "Home",
      fullName: str(a.fullName, 100),
      phone: str(a.phone, 10).replace(/\D/g, ""),
      line1: str(a.line1, 200),
      line2: str(a.line2, 200) || undefined,
      city: str(a.city, 80),
      state: str(a.state, 80),
      pincode: str(a.pincode, 6).replace(/\D/g, ""),
    };
    if (!address.fullName || !address.line1 || !address.city || !address.state) {
      return NextResponse.json({ error: "Please fill the complete address." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!/^[1-9]\d{5}$/.test(address.pincode)) {
      return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
    }
    const updated = saveAddress(user.id, address);
    return NextResponse.json({ ok: true, user: updated });
  }

  if (body.action === "delete-address") {
    const updated = deleteAddress(user.id, typeof body.addressId === "string" ? body.addressId : "");
    return NextResponse.json({ ok: true, user: updated });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
