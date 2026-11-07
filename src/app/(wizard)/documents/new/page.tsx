import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/get-marketing";
import { signerEmailLimit } from "@/lib/packages";
import { SendWizard } from "@/components/send/SendWizard";
import { redirect } from "next/navigation";

export default async function NewDocumentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const site = await getSiteSettings();

  return (
    <SendWizard
      accountEmail={user.email}
      accountName={user.name || ""}
      signerLimit={signerEmailLimit(user, site)}
    />
  );
}
