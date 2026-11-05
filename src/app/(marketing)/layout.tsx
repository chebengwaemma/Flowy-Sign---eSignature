import type { CSSProperties } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Chatbot } from "@/components/Chatbot";
import { buildPricingLinks } from "@/components/marketing/nav-data";
import { getSiteSettings } from "@/lib/get-marketing";
import { getPlans } from "@/lib/plans";
import "./landing.css";

/** Public marketing shell — ISR so cold Mongo hangs don't block every visitor. */
export const revalidate = 60;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const m = settings.marketing;
  const brand = settings.brandName || settings.companyLegalName || "Flowy Sign - eSignature";
  const address = settings.companyAddress || m.footerTagline || "Austell GA, USA";
  const pricingLinks = buildPricingLinks(getPlans(settings), m.home?.planApiPrice);

  const accent = settings.accentColor || "#0284c7";
  const theme = {
    ["--lp-ink"]: settings.primaryColor || "#0b1f33",
    ["--lp-blue"]: accent,
    ["--lp-blue-hover"]: accent,
    ["--lp-signal"]: settings.signalColor || "#e85d04",
  } as CSSProperties;

  return (
    <div className="lp-shell" style={theme}>
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
        pricingLinks={pricingLinks}
      />
      <div className="lp-shell-main">{children}</div>
      <SiteFooter brandName={brand} address={address} links={m.footerLinks} />
      <Chatbot
        enabled={settings.chatbotEnabled}
        name={settings.chatbotName}
        greeting={settings.chatbotGreeting}
      />
    </div>
  );
}
