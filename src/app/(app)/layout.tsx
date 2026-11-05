import { redirect } from "next/navigation";
import { getSessionUser, publicUser, SessionStoreUnavailable } from "@/lib/auth";
import { mergeSettings } from "@/lib/settings";
import { connection } from "next/server";
import { readStore } from "@/lib/store";
import { AppChrome } from "@/components/AppChrome";
import { Chatbot } from "@/components/Chatbot";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let user;
  try {
    user = await getSessionUser();
  } catch (err) {
    if (err instanceof SessionStoreUnavailable) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#f7f5f2] px-6">
          <div className="panel max-w-lg p-8 text-center">
            <h1 className="text-2xl font-semibold text-[#0b3d38]">Still signed in</h1>
            <p className="mt-3 text-[var(--muted)]">
              The database is busy, so this page could not load. You were not logged out. Refresh in a
              moment.
            </p>
          </div>
        </div>
      );
    }
    throw err;
  }
  if (!user) redirect("/login");

  let store: Awaited<ReturnType<typeof readStore>> | null = null;
  try {
    store = await readStore();
  } catch {
    store = null;
  }
  // Live Mongo site CMS (admin) — never use stale org snapshots for branding/plans
  const settings = mergeSettings(store?.site);
  const safe = publicUser(user);

  if (settings.maintenanceMode && safe.role === "member") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f5f2] px-6">
        <div className="panel max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#0b3d38]">Maintenance</h1>
          <p className="mt-3 text-[var(--muted)]">
            {settings.maintenanceMessage || "Please check back shortly."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={
        {
          "--ink": settings.primaryColor || "#0b1220",
          "--accent": settings.accentColor || "#0284c7",
          "--signal": settings.signalColor || "#0ea5e9",
        } as React.CSSProperties
      }
    >
      <AppChrome
        userName={safe.name || "User"}
        userEmail={safe.email || ""}
        plan={safe.plan || "free"}
        brandName={settings.brandName || settings.logoText || "Flowy Sign"}
        showUpgrade={Boolean(settings.showUpgradeButton && settings.billingEnabled)}
        settings={settings}
      >
        {children}
      </AppChrome>
      <Chatbot
        enabled={Boolean(settings.chatbotEnabled)}
        name={settings.chatbotName || "Assist"}
        greeting={settings.chatbotGreeting || "How can I help?"}
      />
    </div>
  );
}
