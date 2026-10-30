import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DetailPage } from "./page-content";
import { MarketingCta, MarketingHero } from "./MarketingPage";

export function DetailPageView({ page }: { page: DetailPage }) {
  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={page.kicker}
        title={page.title}
        lead={page.lead}
        secondaryHref="/contact"
        secondaryLabel="Talk to sales"
      />
      <section className="lp-sub-body">
        <div className="lp-wrap lp-sub-grid" data-animate="stagger">
          {page.sections.map((s) => (
            <article key={s.title} className="lp-sub-card">
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>
      {page.related && page.related.length > 0 && (
        <section className="lp-sub-body cream">
          <div className="lp-wrap">
            <h2 className="lp-h2" data-animate="up">
              Related
            </h2>
            <div className="lp-mega-grid" data-animate="stagger">
              {page.related.map((r) => (
                <Link key={r.href} href={r.href} className="lp-mega-item on-light">
                  <span className="lp-mega-item-title">{r.title}</span>
                  <span className="lp-mega-item-desc">{r.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="lp-sub-body">
        <div className="lp-wrap" data-animate="up">
          <Link href="/signup" className="lp-text-link">
            Start using this in Flowy Sign <ArrowRight size={14} />
          </Link>
        </div>
      </section>
      <MarketingCta />
    </main>
  );
}
