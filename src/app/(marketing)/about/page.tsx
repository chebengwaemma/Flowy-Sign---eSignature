import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const { about, home, aboutCards } = await getMarketing();

  const cards = aboutCards.map((c) => {
    if (c.title === "Where we work") return { ...c, body: settings.companyAddress || c.body };
    return c;
  });

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={about.kicker}
        title={about.title || settings.companyLegalName}
        lead={about.lead || settings.aboutText}
        ctaLabel={about.cta}
        secondaryHref="/press"
        secondaryLabel={about.secondary}
      />
      <MarketingCards items={cards} />
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
