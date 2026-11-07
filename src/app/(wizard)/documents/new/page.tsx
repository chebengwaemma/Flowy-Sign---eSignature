import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/get-marketing";
import { cleanDeviceSigners, deviceSignersLocked, signerEmailLimit } from "@/lib/packages";
import { SendWizard } from "@/components/send/SendWizard";
import { redirect } from "next/navigation";

export default async function NewDocumentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const site = await getSiteSettings();
  const signerLimit = signerEmailLimit(user, site);

  return (
    <SendWizard
      accountEmail={user.email}
      accountName={user.name || ""}
      signerLimit={signerLimit}
      savedSigners={cleanDeviceSigners(user.deviceSigners).slice(0, signerLimit)}
      signersLocked={deviceSignersLocked(user, site)}
    />
  );
}
