import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
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
        <ScrollMeetSplit className="lp-wrap lp-sub-grid lp-meet-grid" itemClassName="lp-meet-item" distance={120}>
          {page.sections.map((s) => (
            <article key={s.title} className="lp-sub-card">
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </article>
          ))}
        </ScrollMeetSplit>
      </section>
      {page.related && page.related.length > 0 && (
        <section className="lp-sub-body cream">
          <div className="lp-wrap">
            <ScrollMeetBlock side="left" className="lp-meet-heading">
              <h2 className="lp-h2">Related</h2>
            </ScrollMeetBlock>
            <ScrollMeetSplit className="lp-mega-grid lp-meet-grid" itemClassName="lp-meet-item" distance={110}>
              {page.related.map((r) => (
                <Link key={r.href} href={r.href} className="lp-mega-item on-light">
                  <span className="lp-mega-item-title">{r.title}</span>
                  <span className="lp-mega-item-desc">{r.desc}</span>
                </Link>
              ))}
            </ScrollMeetSplit>
          </div>
        </section>
      )}
      <section className="lp-sub-body">
        <ScrollMeetBlock side="right" className="lp-wrap">
          <Link href="/signup" className="lp-text-link">
            Start using this in Flowy Sign <ArrowRight size={14} />
          </Link>
        </ScrollMeetBlock>
      </section>
      <MarketingCta />
    </main>
  );
}
