import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function WizardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <div className="send-shell">{children}</div>;
}
