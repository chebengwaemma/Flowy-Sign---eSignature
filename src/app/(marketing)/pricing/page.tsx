import Link from "next/link";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { PlanCatalog } from "@/components/billing/PlanCatalog";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPaidPlans, planDisplayFeatures } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [{ pricing: p, pricingPage: pp }, site] = await Promise.all([
    getMarketing(),
    getSiteSettings(),
  ]);
  const paid = getPaidPlans(site).map((plan) => ({
    id: plan.id,
    name: plan.name,
    category: plan.category,
    maxDevices: plan.maxDevices,
    monthly: plan.monthly,
    yearly: plan.yearly,
    features: planDisplayFeatures(plan),
  }));

  return (
    <main className="lp-page lp-sub">
      <section className="lp-sub-hero">
        <ScrollMeetSplit className="lp-wrap lp-meet-stack" itemClassName="lp-meet-item" distance={90} stagger={0.1}>
          <p className="lp-dev-kicker">{p.kicker}</p>
          <h1>{p.title}</h1>
          <p className="lead">{p.lead}</p>
          <div className="lp-hero-ctas">
            <Link href="/signup" className="lp-btn lp-btn-lg">
              {p.cta}
            </Link>
            <Link href="/contact" className="lp-btn-outline">
              {p.secondary}
            </Link>
          </div>
        </ScrollMeetSplit>
      </section>

      <section className="lp-sub-body" id="plans">
        <div className="lp-wrap">
          <ScrollMeetBlock side="left" className="lp-meet-heading">
            <h2 className="lp-h2">{pp.compareTitle || "Pro & Business"}</h2>
          </ScrollMeetBlock>
          <PlanCatalog
            mode="marketing"
            plans={paid}
            ctaLabel={p.cta}
            compareCta={pp.compareCta || p.cta}
          />
        </div>
      </section>

      {pp.showApiBlock && (
        <section className="lp-sub-body cream" id="api">
          <ScrollMeetBlock side="right" className="lp-wrap">
            <article className="lp-sub-card" style={{ gridColumn: "1 / -1" }}>
              <p className="lp-dev-kicker" style={{ color: "var(--lp-blue)" }}>
                {pp.apiKicker}
              </p>
              <h2 style={{ color: "var(--lp-ink)", fontSize: 28 }}>Need help choosing?</h2>
              <p className="extra">
                Every paid plan includes unlimited signatures, downloads, faxes, and seats. Pick Pro or
                Business, then 1 device or up to 5 devices — monthly or yearly.
              </p>
              <Link href={pp.apiLinkHref || "/contact"} className="lp-text-link">
                {pp.apiLinkLabel || "Talk to us"}
              </Link>
            </article>
          </ScrollMeetBlock>
        </section>
      )}
    </main>
  );
}
