import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";

export function MarketingHero({
  kicker,
  title,
  lead,
  ctaHref = "/signup",
  ctaLabel = "Start a free trial",
  secondaryHref,
  secondaryLabel,
}: {
  kicker: string;
  title: string;
  lead: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="lp-sub-hero">
      <ScrollMeetSplit className="lp-wrap lp-meet-stack" itemClassName="lp-meet-item" distance={90} stagger={0.1}>
        <p className="lp-dev-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <div className="lp-hero-ctas">
          {ctaHref.startsWith("mailto:") ? (
            <a href={ctaHref} className="lp-btn lp-btn-lg">
              {ctaLabel}
            </a>
          ) : (
            <Link href={ctaHref} className="lp-btn lp-btn-lg">
              {ctaLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className="lp-btn-outline">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </ScrollMeetSplit>
    </section>
  );
}

export function MarketingCards({
  items,
  cream = false,
}: {
  items: { id?: string; title: string; body: string; href?: string; linkLabel?: string }[];
  cream?: boolean;
}) {
  return (
    <section className={`lp-sub-body${cream ? " cream" : ""}`}>
      <ScrollMeetSplit className="lp-wrap lp-sub-grid lp-meet-grid" itemClassName="lp-meet-item" distance={120} stagger={0.12}>
        {items.map((item) => (
          <article key={item.id || item.title} id={item.id} className="lp-sub-card">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            {item.href &&
              (item.href.startsWith("mailto:") ? (
                <a href={item.href} className="lp-text-link">
                  {item.linkLabel || "Learn more"} <ArrowRight size={14} />
                </a>
              ) : (
                <Link href={item.href} className="lp-text-link">
                  {item.linkLabel || "Learn more"} <ArrowRight size={14} />
                </Link>
              ))}
          </article>
        ))}
      </ScrollMeetSplit>
    </section>
  );
}

export function MarketingCta({
  title = "Ready to make eSignatures easier for your team?",
}: {
  title?: string;
}) {
  return (
    <section className="lp-bottom-cta">
      <ScrollMeetBlock side="left" className="lp-wrap">
        <h2>{title}</h2>
        <div className="lp-hero-ctas">
          <Link href="/signup" className="lp-btn lp-btn-lg">
            Start a free trial
          </Link>
          <Link href="/contact" className="lp-btn-outline">
            Contact sales
          </Link>
        </div>
      </ScrollMeetBlock>
    </section>
  );
}
