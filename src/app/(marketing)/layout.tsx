import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Chatbot } from "@/components/Chatbot";
import { getSiteSettings } from "@/lib/get-marketing";
import "./landing.css";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const m = settings.marketing;
  const brand = settings.brandName || settings.companyLegalName || "Flowy Sign - eSignature";
  const address = settings.companyAddress || m.footerTagline || "Austell GA, USA";

  return (
    <div className="lp-shell">
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
    </div>
  );
}
