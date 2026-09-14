import { NextResponse } from "next/server";
import { currentAdmin, canAccess } from "@/lib/admin-users";
import { listCustomers, setBlocked, listOrdersByEmail } from "@/lib/orders";

async function authed(): Promise<boolean> {
  const admin = await currentAdmin();
  return admin !== null && canAccess(admin.role, "customers");
}

export async function GET(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (email) {
    return NextResponse.json({ orders: listOrdersByEmail(email) });
  }
  return NextResponse.json({ customers: listCustomers() });
}

/** POST { email, blocked } — block/unblock a customer account */
export async function POST(request: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: { email?: unknown; blocked?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });
  setBlocked(email, body.blocked === true);
  return NextResponse.json({ ok: true });
}
