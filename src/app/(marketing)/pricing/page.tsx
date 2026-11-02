import Link from "next/link";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPlans, planDisplayFeatures } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [{ pricing: p, home, pricingPage: pp }, site] = await Promise.all([
    getMarketing(),
    getSiteSettings(),
  ]);
  const plans = getPlans(site).filter((x) => x.visible);
  const paid = plans.filter((x) => x.id !== "free");
  const essentials = paid[0] || plans[0];
  const standard = paid[1] || paid[0] || essentials;

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

      {pp.showHighlightRow && (
        <section className="lp-plans" id="essentials">
          <ScrollMeetSplit className="lp-wrap lp-plans-inner lp-meet-grid" itemClassName="lp-meet-item" distance={160} stagger={0.14}>
            <article className="lp-plan-card" id="standard">
              <p className="eyebrow">{pp.essentialsEyebrow}</p>
              <h3>{essentials?.name || home.planTeamTitle}</h3>
              <p className="price">
                {pp.startsAtLabel}{" "}
                <strong>${essentials?.monthly ?? home.planTeamPrice}</strong>
                <span>{pp.monthSuffix}</span>
              </p>
              <p className="desc">
                {(essentials ? planDisplayFeatures(essentials) : [home.planTeamBody]).join(" · ")}
              </p>
              <Link href="/signup" className="lp-btn">
                {p.cta}
              </Link>
            </article>
            <article className="lp-plan-card alt">
              <p className="eyebrow">{pp.standardEyebrow}</p>
              <h3>{standard?.name || "For growing teams"}</h3>
              <p className="price">
                {pp.startsAtLabel}{" "}
                <strong>${standard?.monthly ?? home.planTeamPrice ?? essentials?.monthly ?? 0}</strong>
                <span>{pp.monthSuffix}</span>
              </p>
              <p className="desc">
                {(standard
                  ? planDisplayFeatures(standard)
                  : essentials
                    ? planDisplayFeatures(essentials)
                    : [home.planTeamBody]
                ).join(" · ")}
              </p>
              <Link href="/signup" className="lp-btn-muted">
                {pp.standardCta}
              </Link>
            </article>
          </ScrollMeetSplit>
        </section>
      )}

      {pp.showApiBlock && (
        <section className="lp-sub-body cream" id="api">
          <ScrollMeetBlock side="right" className="lp-wrap">
            <article className="lp-sub-card" style={{ gridColumn: "1 / -1" }}>
              <p className="lp-dev-kicker" style={{ color: "var(--lp-blue)" }}>
                {pp.apiKicker}
              </p>
              <h2 style={{ color: "var(--lp-ink)", fontSize: 28 }}>{home.planApiTitle}</h2>
              <p className="extra">
                {pp.startsAtLabel}{" "}
                <strong>
                  ${home.planApiPrice}
                  {pp.monthSuffix}
                </strong>{" "}
                — {home.planApiBody}
              </p>
              <Link href={pp.apiLinkHref || "/developers"} className="lp-text-link">
                {pp.apiLinkLabel}
              </Link>
            </article>
          </ScrollMeetBlock>
        </section>
      )}

      {pp.showCompare && (
        <section className="lp-sub-body">
          <div className="lp-wrap">
            <ScrollMeetBlock side="left" className="lp-meet-heading">
              <h2 className="lp-h2">{pp.compareTitle}</h2>
            </ScrollMeetBlock>
            <ScrollMeetSplit className="lp-sub-grid lp-meet-grid" itemClassName="lp-meet-item" distance={120} stagger={0.12}>
              {plans.map((plan) => (
                <article key={plan.id} className="lp-sub-card">
                  <h2>{plan.name}</h2>
                  <p>
                    ${plan.monthly}
                    <span>/mo</span>
                    {plan.yearly > 0 ? <span className="extra"> · ${plan.yearly}/yr</span> : null}
                  </p>
                  <ul className="extra" style={{ paddingLeft: 18, marginTop: 12 }}>
                    {planDisplayFeatures(plan).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/signup" className="lp-btn" style={{ marginTop: 16 }}>
                    {pp.compareCta}
                  </Link>
                </article>
              ))}
            </ScrollMeetSplit>
          </div>
        </section>
      )}
    </main>
  );
}
