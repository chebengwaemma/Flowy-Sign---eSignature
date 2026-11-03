import Link from "next/link";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
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
          <ScrollMeetBlock side="left" className="lp-meet-heading">
            <h2 className="lp-h2">Built for every team</h2>
          </ScrollMeetBlock>
          <ScrollMeetSplit className="lp-mega-grid lp-meet-grid" itemClassName="lp-meet-item" distance={120}>
            {teamPages.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="lp-mega-item on-light">
                <span className="lp-mega-item-title">{t.title.replace("eSignatures for ", "")}</span>
                <span className="lp-mega-item-desc">{t.lead}</span>
              </Link>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
