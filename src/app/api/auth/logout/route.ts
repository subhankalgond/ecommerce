import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE, destroySession } from "@/lib/auth-users";

/** POST /api/auth/logout — clears the customer session cookie */
export async function POST(request: Request) {
  destroySession(request.headers.get("cookie")?.match(/customer_session=([^;]+)/)?.[1]);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
