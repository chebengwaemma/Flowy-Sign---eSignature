import Link from "next/link";
import { PlanCatalog } from "@/components/billing/PlanCatalog";
import { getSessionUser } from "@/lib/auth";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { purchasedInterval } from "@/lib/packages";
import { getPaidPlans } from "@/lib/plans";

export default async function PricingPage() {
  const [{ pricing: p, pricingPage: pp }, site, user] = await Promise.all([
    getMarketing(),
    getSiteSettings(),
    getSessionUser().catch(() => null),
  ]);
  const paid = getPaidPlans(site).map((plan) => ({
    id: plan.id,
    name: plan.name,
    category: plan.category,
    maxDevices: plan.maxDevices,
    monthly: plan.monthly,
    yearly: plan.yearly,
    features: plan.features,
  }));

  return (
    <main className="lp-page lp-sub">
      <section className="lp-sub-hero">
        <div className="lp-wrap lp-pricing-static">
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
        </div>
      </section>

      {pp.showCompare !== false && (
      <section className="lp-sub-body" id="plans">
        <div className="lp-wrap">
          <div className="lp-pricing-static">
            <p className="lp-dev-kicker">{pp.compareTitle || "Compare packages"}</p>
            <h2 className="lp-h2">{pp.compareHeading}</h2>
          </div>
          <PlanCatalog
            mode={user && user.plan !== "free" ? "billing" : "marketing"}
            plans={paid}
            currentPlan={user?.plan}
            currentInterval={user ? purchasedInterval(user) : null}
            ctaLabel={p.cta}
            compareCta={pp.compareCta || p.cta}
          />
        </div>
      </section>
      )}

      {pp.showApiBlock && (
        <section className="lp-sub-body cream" id="api">
          <div className="lp-wrap">
            <article className="lp-sub-card" style={{ gridColumn: "1 / -1" }}>
              <p className="lp-dev-kicker" style={{ color: "var(--lp-blue)" }}>
                {pp.apiKicker}
              </p>
              <h2 style={{ color: "var(--lp-ink)", fontSize: 28 }}>{pp.apiTitle}</h2>
              <p className="extra">{pp.apiBody}</p>
              <Link
                href={!pp.apiLinkHref || pp.apiLinkHref.includes("/developers") ? "/contact" : pp.apiLinkHref}
                className="lp-text-link"
              >
                {pp.apiLinkLabel || "Talk to us"}
              </Link>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
