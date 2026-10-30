import Link from "next/link";
import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing } from "@/lib/get-marketing";

export default async function FeaturesPage() {
  const { features, home, navWhy, featurePages } = await getMarketing();

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={features.kicker}
        title={features.title}
        lead={features.lead}
        ctaLabel={features.cta}
        secondaryHref="/developers"
        secondaryLabel={features.secondary}
      />
      <MarketingCards
        items={featurePages.map((p) => ({
          id: p.slug,
          title: p.title,
          body: p.lead,
          href: `/features/${p.slug}`,
          linkLabel: "Open page",
        }))}
      />
      <section className="lp-sub-body cream">
        <div className="lp-wrap" data-animate="up">
          <Link href="/why" className="lp-btn">
            {navWhy}
          </Link>
        </div>
      </section>
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
