import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WizardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <div className="send-shell">{children}</div>;
}
