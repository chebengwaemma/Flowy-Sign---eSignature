import Link from "next/link";
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
        <div className="lp-wrap" data-animate="up">
          <Link href="/about" className="lp-btn">
            Read our story
          </Link>
        </div>
      </section>
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
