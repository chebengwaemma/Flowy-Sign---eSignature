import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLoginForm } from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  await connection();
  const admin = await getAdminSession();
  if (admin) redirect("/admin");

  return <AdminLoginForm />;
}
