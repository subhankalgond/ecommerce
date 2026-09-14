import { NextResponse } from "next/server";
import { ADMIN_COOKIE, destroyAdminSession } from "@/lib/admin-users";

export async function POST(request: Request) {
  destroyAdminSession(
    request.headers.get("cookie")?.match(/admin_session=([^;]+)/)?.[1]
  );
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
