import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { getMarketing } from "@/lib/get-marketing";

export default async function PricingPage() {
  const { pricing: p, home } = await getMarketing();
  const essentials = PLANS.find((x) => x.id === "starter" || x.monthly === 15) || PLANS[0];
  const standard = PLANS.find((x) => x.monthly >= 20) || PLANS[1] || essentials;

  return (
    <main className="lp-page lp-sub">
      <section className="lp-sub-hero">
        <div className="lp-wrap" data-animate="up">
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

      <section className="lp-plans" id="essentials">
        <div className="lp-wrap lp-plans-inner" data-animate="stagger">
          <article className="lp-plan-card" id="standard">
            <p className="eyebrow">Essentials</p>
            <h3>{home.planTeamTitle}</h3>
            <p className="price">
              Starts at <strong>${essentials?.monthly ?? home.planTeamPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">
              {(essentials?.features || ["Unlimited templates", "Audit trail", "Reminders"]).join(
                " · ",
              )}
            </p>
            <Link href="/signup" className="lp-btn">
              {p.cta}
            </Link>
          </article>
          <article className="lp-plan-card alt">
            <p className="eyebrow">Standard</p>
            <h3>For growing teams</h3>
            <p className="price">
              Starts at <strong>${standard?.monthly ?? 25}</strong>
              <span>/user / month</span>
            </p>
            <p className="desc">
              {(standard?.features || ["Team roles", "Branding", "Bulk send"]).join(" · ")}
            </p>
            <Link href="/signup" className="lp-btn-muted">
              Get started
            </Link>
          </article>
        </div>
      </section>

      <section className="lp-sub-body cream" id="api">
        <div className="lp-wrap lp-plans-inner" data-animate="stagger">
          <article className="lp-sub-card" style={{ gridColumn: "1 / -1" }}>
            <p className="lp-dev-kicker" style={{ color: "#0061ff" }}>
              API plans
            </p>
            <h2 style={{ color: "#1e1919", fontSize: 28 }}>{home.planApiTitle}</h2>
            <p className="extra">
              Starts at <strong>${home.planApiPrice}/month</strong> — {home.planApiBody}
            </p>
            <Link href="/developers" className="lp-text-link">
              Explore developers →
            </Link>
          </article>
        </div>
      </section>

      <section className="lp-sub-body">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            Compare plans
          </h2>
          <div className="lp-sub-grid" data-animate="stagger">
            {PLANS.map((plan) => (
              <article key={plan.id} className="lp-sub-card">
                <h2>{plan.name}</h2>
                <p>
                  ${plan.monthly}
                  <span>/mo</span>
                </p>
                <ul className="extra" style={{ paddingLeft: 18, marginTop: 12 }}>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="lp-btn" style={{ marginTop: 16 }}>
                  Get started
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
