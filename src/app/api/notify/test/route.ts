import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-users";
import { notifyConfigured, sendAdminEmail } from "@/lib/notify";

/**
 * Send a test notification email to ADMIN_EMAIL. Open it while logged in to
 * /admin (or after logging in) to confirm your Resend setup works:
 *
 *   GET /api/notify/test
 *
 * Only ever sends to the admin's own configured address.
 */
export async function GET() {
  if ((await currentAdmin()) === null) {
    return NextResponse.json(
      { error: "Unauthorized — log in at /admin first." },
      { status: 401 }
    );
  }

  const config = notifyConfigured();
  if (!config.email) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set RESEND_API_KEY and ADMIN_EMAIL in .env, then restart the dev server.",
      },
      { status: 400 }
    );
  }

  try {
    await sendAdminEmail(
      "✅ Nova Threads test notification",
      `<div style="font-family:sans-serif;max-width:520px">
        <h2>Test notification ✅</h2>
        <p>This is a test email from your Nova Threads store.</p>
        <p style="color:#666">If you can read this, order notifications are working. Every new order (online or COD) will arrive here with the items, total and a link to the admin dashboard.</p>
      </div>`
    );
    return NextResponse.json({ ok: true, sentTo: "ADMIN_EMAIL" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json(
      { error: `Resend rejected the test email: ${message}` },
      { status: 502 }
    );
  }
}
