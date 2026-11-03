import { getSessionUser } from "@/lib/auth";
import { SendWizard } from "@/components/send/SendWizard";
import { redirect } from "next/navigation";

export default async function NewDocumentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Quota is enforced on send (API + wizard 402 CTA), not on opening the flow
  return <SendWizard />;
}
