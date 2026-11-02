import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPlans } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function DevelopersPage() {
  const [{ developers: d, home, developersBlocks }, site] = await Promise.all([
    getMarketing(),
    getSiteSettings(),
  ]);
  const starter = getPlans(site).find((p) => p.id === "starter");
  const teamPrice = starter ? String(starter.monthly) : home.planTeamPrice;
  const teamTitle = starter?.name || home.planTeamTitle;
  const apiPrice = home.planApiPrice || teamPrice;

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
            <p className="eyebrow">For teams</p>
            <h3>{teamTitle}</h3>
            <p className="price">
              Starts at <strong>${teamPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">{home.planTeamBody}</p>
            <Link href="/signup" className="lp-btn">
              {home.heroCta}
            </Link>
          </article>
          <article className="lp-plan-card alt">
            <p className="eyebrow">For developers</p>
            <h3>{home.planApiTitle}</h3>
            <p className="price">
              Starts at <strong>${apiPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">{home.planApiBody}</p>
            <Link href="/developers" className="lp-btn-muted">
              Get started <ArrowRight size={16} />
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
