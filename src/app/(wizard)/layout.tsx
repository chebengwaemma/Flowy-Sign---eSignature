import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSessionUser, SessionStoreUnavailable } from "@/lib/auth";
import { signatureFontsClassName } from "@/components/signature/signature-fonts";

export const dynamic = "force-dynamic";

export default async function WizardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let user;
  try {
    user = await getSessionUser();
  } catch (err) {
    if (err instanceof SessionStoreUnavailable) {
      return (
        <div className="grid min-h-screen place-items-center px-6">
          <p className="max-w-md text-center text-[var(--muted)]">
            Still signed in. The database is busy — refresh this page. You were not logged out.
          </p>
        </div>
      );
    }
    throw err;
  }
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/account/password");
  return <div className={`send-shell ${signatureFontsClassName}`}>{children}</div>;
}
