import Link from "next/link";
import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing } from "@/lib/get-marketing";

export default async function WhyPage() {
  const { why, home, featurePages, teamPages } = await getMarketing();

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={why.kicker}
        title={why.title}
        lead={why.lead}
        ctaLabel={why.cta}
        secondaryHref="/features"
        secondaryLabel={why.secondary}
      />
      <MarketingCards
        items={featurePages.slice(0, 6).map((p) => ({
          id: p.slug,
          title: p.title,
          body: p.lead,
          href: `/features/${p.slug}`,
          linkLabel: "Learn more",
        }))}
      />
      <section className="lp-sub-body cream">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            Built for every team
          </h2>
          <div className="lp-mega-grid" data-animate="stagger">
            {teamPages.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="lp-mega-item on-light">
                <span className="lp-mega-item-title">{t.title.replace("eSignatures for ", "")}</span>
                <span className="lp-mega-item-desc">{t.lead}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
