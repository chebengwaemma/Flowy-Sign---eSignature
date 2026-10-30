import { MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { HelpFaq } from "@/components/marketing/HelpFaq";
import { getMarketing } from "@/lib/get-marketing";

export default async function HelpPage() {
  const { help, faqs } = await getMarketing();

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={help.kicker}
        title={help.title}
        lead={help.lead}
        ctaHref="/contact"
        ctaLabel={help.cta}
        secondaryHref="/signup"
        secondaryLabel={help.secondary}
      />
      <HelpFaq faqs={faqs} />
      <MarketingCta title="Still have questions?" />
    </main>
  );
}
