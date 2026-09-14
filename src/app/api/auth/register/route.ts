import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  registerUser,
  createSession,
  toPublic,
} from "@/lib/auth-users";

/** POST /api/auth/register — create a customer account (Flipkart-style signup) */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; name?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name : undefined;
  const phone = typeof body.phone === "string" ? body.phone : undefined;

  const result = registerUser({ email, password, name, phone });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const token = createSession(result.user.id);
  const res = NextResponse.json({ ok: true, user: toPublic(result.user) });
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
