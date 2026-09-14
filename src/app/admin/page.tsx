import type { Metadata } from "next";
import { currentAdmin, toPublicAdmin } from "@/lib/admin-users";
import AdminDashboard from "./dashboard";

export const metadata: Metadata = {
  title: "Admin — Nova Threads",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await currentAdmin();

  return (
    <AdminDashboard
      initialAuthed={admin !== null}
      initialAdmin={admin ? toPublicAdmin(admin) : null}
      adminEmailHint={process.env.ADMIN_EMAIL ?? null}
    />
  );
}
