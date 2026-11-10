import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { ADMIN_PANEL_PATH } from "@/lib/admin-path";
import { AdminLoginForm } from "../../login/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  await connection();
  const admin = await getAdminSession();
  if (admin) redirect(ADMIN_PANEL_PATH);

  return <AdminLoginForm />;
}
