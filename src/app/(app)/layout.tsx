import { redirect } from "next/navigation";
import { getSessionUser, publicUser } from "@/lib/auth";
import { mergeSettings } from "@/lib/settings";
import { connection } from "next/server";
import { readStore } from "@/lib/store";
import { AppChrome } from "@/components/AppChrome";
import { Chatbot } from "@/components/Chatbot";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await readStore();
  // Live Mongo site CMS (admin) — never use stale org snapshots for branding/plans
  const settings = mergeSettings(store.site);
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
          "--ink": settings.primaryColor || "#062925",
          "--accent": settings.accentColor || "#1FA97A",
          "--signal": settings.signalColor || "#FF6B35",
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
