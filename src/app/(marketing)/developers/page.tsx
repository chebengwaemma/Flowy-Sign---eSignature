import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPlans } from "@/lib/plans";

export const revalidate = 60;

export default async function DevelopersPage() {
  const [{ developers: d, home, developersBlocks }, site] = await Promise.all([
    getMarketing(),
    getSiteSettings(),
  ]);
  const pro = getPlans(site).find((p) => p.id === "pro");
  const business =
    getPlans(site).find((p) => p.id === "business_5") || getPlans(site).find((p) => p.id === "business");
  const teamPrice = pro ? String(pro.monthly) : home.planTeamPrice;
  const teamTitle = pro?.name || home.planTeamTitle || "Pro · 1 device";
  const apiPrice = business ? String(business.monthly) : home.planApiPrice || teamPrice;

  return (
    <main className="lp-page lp-dev">
      <section className="lp-dev-hero">
        <ScrollMeetSplit className="lp-wrap lp-dev-hero-inner lp-meet-grid" itemClassName="lp-meet-item" distance={140} stagger={0.14}>
          <div>
            <p className="lp-dev-kicker">{d.kicker}</p>
            <h1>{d.title}</h1>
            <p className="lead">{d.lead}</p>
            <div className="lp-hero-ctas">
              <Link href="/signup" className="lp-btn lp-btn-lg">
                {d.cta}
              </Link>
              <Link href="/api-docs" className="lp-btn-outline">
                {d.secondary}
              </Link>
            </div>
          </div>
          <pre className="lp-dev-code" aria-hidden>
{`POST /api/documents
Authorization: Bearer sk_live_••••

{
  "title": "Vendor NDA",
  "recipients": [
    { "email": "alex@acme.com", "role": "signer" }
  ],
  "notify": true
}

→ 201 Created
{ "id": "doc_8f2a", "status": "sent" }`}
          </pre>
        </ScrollMeetSplit>
      </section>

      <section className="lp-dev-features">
        <div className="lp-wrap">
          <ScrollMeetBlock side="left" className="lp-meet-heading">
            <h2 className="lp-h2">Everything developers need</h2>
          </ScrollMeetBlock>
          <ScrollMeetSplit className="lp-dev-grid lp-meet-grid" itemClassName="lp-meet-item" distance={110} stagger={0.1}>
            {developersBlocks.map((block) => (
              <article key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </article>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>

      <section className="lp-plans">
        <ScrollMeetSplit className="lp-wrap lp-plans-inner lp-meet-grid" itemClassName="lp-meet-item" distance={160} stagger={0.14}>
          <article className="lp-plan-card">
            <p className="eyebrow">Pro</p>
            <h3>{teamTitle}</h3>
            <p className="price">
              Starts at <strong>${teamPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">
              {home.planTeamBody || "Unlimited features on a single device — monthly or yearly."}
            </p>
            <Link href="/pricing" className="lp-btn">
              {home.heroCta}
            </Link>
          </article>
          <article className="lp-plan-card alt">
            <p className="eyebrow">Business</p>
            <h3>{business?.name || home.planApiTitle || "Business · 5 devices"}</h3>
            <p className="price">
              Starts at <strong>${apiPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">
              {home.planApiBody || "Unlimited everything with 1 or 5 concurrent devices."}
            </p>
            <Link href="/pricing" className="lp-btn-muted">
              See pricing <ArrowRight size={16} />
            </Link>
          </article>
        </ScrollMeetSplit>
      </section>

      <section className="lp-bottom-cta">
        <ScrollMeetSplit className="lp-wrap lp-meet-stack lp-bottom-meet" itemClassName="lp-meet-item" distance={80} stagger={0.1}>
          <h2>{home.bottomTitle}</h2>
          <div className="lp-hero-ctas">
            <Link href="/signup" className="lp-btn lp-btn-lg">
              {d.cta}
            </Link>
            <Link href="/contact" className="lp-btn-outline">
              {home.heroSecondary}
            </Link>
          </div>
        </ScrollMeetSplit>
      </section>
    </main>
  );
}
