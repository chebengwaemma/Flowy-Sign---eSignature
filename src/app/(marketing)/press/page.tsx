import Link from "next/link";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing } from "@/lib/get-marketing";

export default async function PressPage() {
  const { press, home, pressCards } = await getMarketing();

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={press.kicker}
        title={press.title}
        lead={press.lead}
        ctaHref="/contact"
        ctaLabel={press.cta}
        secondaryHref="/about"
        secondaryLabel={press.secondary}
      />
      <MarketingCards items={pressCards} />
      <section className="lp-sub-body cream">
        <ScrollMeetBlock side="left" className="lp-wrap">
          <Link href="/about" className="lp-btn">
            Read our story
          </Link>
        </ScrollMeetBlock>
      </section>
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
