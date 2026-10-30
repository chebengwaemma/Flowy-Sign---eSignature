import { MarketingCards, MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { getMarketing } from "@/lib/get-marketing";

export default async function TeamsPage() {
  const { teams, home, teamPages } = await getMarketing();

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={teams.kicker}
        title={teams.title}
        lead={teams.lead}
        ctaLabel={teams.cta}
        secondaryHref="/pricing"
        secondaryLabel={teams.secondary}
      />
      <MarketingCards
        items={teamPages.map((p) => ({
          id: p.slug,
          title: p.title.replace("eSignatures for ", ""),
          body: p.lead,
          href: `/teams/${p.slug}`,
          linkLabel: "See the solution",
        }))}
      />
      <MarketingCta title={home.bottomTitle} />
    </main>
  );
}
