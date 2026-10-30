import { redirect } from "next/navigation";
import { getSessionUser, publicUser } from "@/lib/auth";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";
import { AppChrome } from "@/components/AppChrome";
import { Chatbot } from "@/components/Chatbot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await readStore();
  const org = store.organizations.find((o) => o.id === user.orgId);
  const settings = mergeSettings(org?.settings ?? store.site);
  const safe = publicUser(user);

  if (settings.maintenanceMode && safe.role === "member") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f5f2] px-6">
        <div className="panel max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#0b3d38]">Maintenance</h1>
          <p className="mt-3 text-[var(--muted)]">{settings.maintenanceMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={
        {
          "--ink": settings.primaryColor,
          "--accent": settings.accentColor,
          "--signal": settings.signalColor,
        } as React.CSSProperties
      }
    >
      <AppChrome
        userName={safe.name}
        userEmail={safe.email}
        plan={safe.plan}
        brandName={settings.brandName || settings.logoText}
        showUpgrade={settings.showUpgradeButton && settings.billingEnabled}
        settings={settings}
      >
        {children}
      </AppChrome>
      <Chatbot
        enabled={settings.chatbotEnabled}
        name={settings.chatbotName}
        greeting={settings.chatbotGreeting}
      />
    </div>
  );
}
