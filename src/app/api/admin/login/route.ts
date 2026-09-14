import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  authenticateAdmin,
  createAdminSession,
  ensureBootstrapAdmin,
  toPublicAdmin,
} from "@/lib/admin-users";
import { rateLimit } from "@/lib/admin-auth";

export async function POST(request: Request) {
  // Brute-force protection: 8 attempts per 15 minutes per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(
          limit.retryInMs / 60000
        )} minutes.`,
      },
      { status: 429 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Make sure the .env Super Admin exists before the very first sign-in
  ensureBootstrapAdmin();

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = authenticateAdmin(email, password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const token = createAdminSession(result.user.id);
  const res = NextResponse.json({ ok: true, admin: toPublicAdmin(result.user) });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
