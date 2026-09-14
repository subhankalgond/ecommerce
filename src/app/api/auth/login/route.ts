import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  authenticateUser,
  createSession,
  toPublic,
} from "@/lib/auth-users";

/** POST /api/auth/login — customer sign-in */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = authenticateUser(email, password);
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
