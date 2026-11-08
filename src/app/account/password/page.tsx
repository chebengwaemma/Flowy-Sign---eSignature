import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ChangePasswordForm forced={Boolean(user.mustChangePassword)} />;
}
