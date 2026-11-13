import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LiveSiteSync } from "@/components/LiveSiteSync";
import { getPublicSite } from "@/lib/get-marketing";
import { elegantFontClassName } from "@/components/signature/elegant-font";
import "./landing.css";

const Chatbot = dynamic(() => import("@/components/Chatbot").then((m) => m.Chatbot));

/** Cached public shell. An admin save calls revalidatePath, so this does not stay stale. */
export const revalidate = 60;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { settings, revision } = await getPublicSite();
  const m = settings.marketing;
  const brand = settings.brandName || settings.companyLegalName || "Flowy Sign - eSignature";
  const address = settings.companyAddress || m.footerTagline || "Austell GA, USA";

  const accent = settings.accentColor || "#0284c7";
  const theme = {
    ["--lp-ink"]: settings.primaryColor || "#0b1f33",
    ["--lp-blue"]: accent,
    ["--lp-blue-hover"]: accent,
    ["--lp-signal"]: settings.signalColor || "#e85d04",
  } as CSSProperties;

  return (
    <div className={`lp-shell ${elegantFontClassName}`} style={theme}>
      <SiteHeader
        nav={{
          why: m.navWhy,
          features: m.navFeatures,
          teams: m.navTeams,
          developers: m.navDevelopers,
          pricing: m.navPricing,
          support: m.navSupport,
          login: m.navLogin,
          getStarted: m.navGetStarted,
        }}
        brandLabel={settings.logoText || brand}
      />
      <div className="lp-shell-main">{children}</div>
      <SiteFooter brandName={brand} address={address} links={m.footerLinks} />
      <Chatbot
        enabled={settings.chatbotEnabled}
        name={settings.chatbotName}
        greeting={settings.chatbotGreeting}
      />
      <LiveSiteSync revision={revision} />
    </div>
  );
}
