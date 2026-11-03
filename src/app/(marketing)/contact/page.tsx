import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { contact, contactCards } = await getMarketing();

  const cards = contactCards.map((c) => {
    if (c.title === "Company") return { ...c, body: settings.companyLegalName };
    if (c.title === "Address") return { ...c, body: settings.companyAddress };
    if (c.title === "Email") {
      return {
        ...c,
        body: settings.supportEmail,
        href: `mailto:${settings.supportEmail}`,
      };
    }
    return c;
  });

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={contact.kicker}
        title={contact.title}
        lead={contact.lead}
        ctaHref={`mailto:${settings.supportEmail}`}
        ctaLabel={contact.cta}
        secondaryHref="/help"
        secondaryLabel={contact.secondary}
      />
      <MarketingCards items={cards} />
      <MarketingCta title="Prefer to try the product first?" />
    </main>
  );
}
