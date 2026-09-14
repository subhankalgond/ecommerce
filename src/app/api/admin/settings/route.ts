import { NextResponse } from "next/server";
import {
  currentAdmin,
  toPublicAdmin,
  inviteAdmin,
  removeAdmin,
  changeRole,
  changeOwnPassword,
  updateOwnProfile,
  listAdmins,
  loadActivity,
} from "@/lib/admin-users";

/** GET /api/admin/settings — team, activity log, own identity */
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  return NextResponse.json({
    me: toPublicAdmin(admin),
    team: admin.role === "super" ? listAdmins() : [],
    activity: admin.role === "super" ? loadActivity().slice(0, 50) : [],
  });
}

/** POST /api/admin/settings — profile / password / team actions */
export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: {
    action?: unknown;
    name?: unknown;
    current?: unknown;
    next?: unknown;
    email?: unknown;
    role?: unknown;
    password?: unknown;
    id?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v : "");

  if (body.action === "update-profile") {
    const updated = updateOwnProfile(admin, { name: str(body.name) });
    return NextResponse.json({ ok: true, me: updated });
  }

  if (body.action === "change-password") {
    const result = changeOwnPassword(admin, str(body.current), str(body.next));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "invite") {
    const result = inviteAdmin(admin, {
      email: str(body.email),
      name: str(body.name),
      role: str(body.role),
      password: str(body.password),
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, team: listAdmins() });
  }

  if (body.action === "remove") {
    const result = removeAdmin(admin, str(body.id));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, team: listAdmins() });
  }

  if (body.action === "change-role") {
    const result = changeRole(admin, str(body.id), str(body.role));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, team: listAdmins() });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
