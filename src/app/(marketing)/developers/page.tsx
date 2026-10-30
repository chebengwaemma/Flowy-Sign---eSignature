import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMarketing } from "@/lib/get-marketing";

export default async function DevelopersPage() {
  const { developers: d, home, developersBlocks } = await getMarketing();

  return (
    <main className="lp-page lp-dev">
      <section className="lp-dev-hero">
        <div className="lp-wrap lp-dev-hero-inner">
          <div data-animate="up">
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
          <pre className="lp-dev-code" data-animate="scale" aria-hidden>
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
        </div>
      </section>

      <section className="lp-dev-features">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            Everything developers need
          </h2>
          <div className="lp-dev-grid" data-animate="stagger">
            {developersBlocks.map((block) => (
              <article key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-plans">
        <div className="lp-wrap lp-plans-inner" data-animate="stagger">
          <article className="lp-plan-card">
            <p className="eyebrow">For teams</p>
            <h3>{home.planTeamTitle}</h3>
            <p className="price">
              Starts at <strong>${home.planTeamPrice}</strong>
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
              Starts at <strong>${home.planApiPrice}</strong>
              <span>/month</span>
            </p>
            <p className="desc">{home.planApiBody}</p>
            <Link href="/developers" className="lp-btn-muted">
              Get started <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="lp-bottom-cta">
        <div className="lp-wrap" data-animate="up">
          <h2>{home.bottomTitle}</h2>
          <div className="lp-hero-ctas">
            <Link href="/signup" className="lp-btn lp-btn-lg">
              {d.cta}
            </Link>
            <Link href="/contact" className="lp-btn-outline">
              {home.heroSecondary}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
