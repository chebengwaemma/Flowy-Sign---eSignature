import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  IconBusywork,
  IconSecure,
  IconTeams,
  IconWorkflow,
} from "@/components/landing/FeatureIcons";
import { IntegrationsMarquee } from "@/components/landing/IntegrationsMarquee";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPlans } from "@/lib/plans";

const ORBIT_MARKS = [
  { name: "Drive", fg: "#4285F4", mark: "G" },
  { name: "Slack", fg: "#611f69", mark: "S" },
  { name: "Salesforce", fg: "#00A1E0", mark: "☁" },
  { name: "HubSpot", fg: "#FF7A59", mark: "H" },
  { name: "OneDrive", fg: "#0078D4", mark: "☁" },
  { name: "Outlook", fg: "#0072C6", mark: "O" },
];

function withEsignUnderline(text: string) {
  const parts = text.split(/(eSignatures)/i);
  return parts.map((part, i) =>
    /^eSignatures$/i.test(part) ? (
      <span key={i} className="lp-integ-em">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default async function HomePage() {
  // getMarketing → getSiteSettings; React cache() dedupes within the request.
  const m = await getMarketing();
  const site = await getSiteSettings();
  const h = m.home;
  const STEPS = m.steps;
  const TEAMS = m.teamCards;
  const plans = getPlans(site);
  const pro = plans.find((p) => p.id === "pro");
  const business = plans.find((p) => p.id === "business_5") || plans.find((p) => p.id === "business");
  const teamPrice = pro ? String(pro.monthly) : h.planTeamPrice;
  const teamTitle = pro?.name || h.planTeamTitle || "Pro · 1 device";
  const musclePrice = business ? String(business.monthly) : h.planApiPrice;
  const muscleTitle = business?.name || h.planApiTitle || "Business · 5 devices";
  const startsAt = m.pricingPage.startsAtLabel || "Starts at";
  const monthSuffix = m.pricingPage.monthSuffix || "/month";

  const pillars = [
    { title: h.pillar1Title, body: h.pillar1Body, icon: <IconWorkflow /> },
    { title: h.pillar2Title, body: h.pillar2Body, icon: <IconBusywork /> },
    { title: h.pillar3Title, body: h.pillar3Body, icon: <IconTeams /> },
    { title: h.pillar4Title, body: h.pillar4Body, icon: <IconSecure /> },
  ];

  const stories = [
    { metric: h.story1Metric, quote: h.story1Quote, by: h.story1By, tone: "" },
    { metric: h.story2Metric, quote: h.story2Quote, by: h.story2By, tone: "" },
    { metric: h.story3Metric, quote: h.story3Quote, by: h.story3By, tone: "" },
  ];

  return (
    <main className="lp-page">
      <section className="lp-hero">
        <div className="lp-hero-atmosphere" aria-hidden />
        <div className="lp-hero-runners" aria-hidden>
          <span className="lp-runner r1" />
          <span className="lp-runner r2" />
          <span className="lp-runner r3" />
          <span className="lp-runner r4" />
          <span className="lp-blob b1" />
          <span className="lp-blob b2" />
          <span className="lp-blob b3" />
        </div>
        <ScrollMeetSplit className="lp-hero-inner lp-meet-grid" itemClassName="lp-meet-item" distance={160} scrub={0.85}>
          <div className="lp-hero-copy">
            <p className="lp-hero-brand">Flowy Sign - eSignature</p>
            <h1>{h.heroTitle}</h1>
            <p className="lead">{h.heroLead}</p>
            <div className="lp-hero-ctas">
              <Link href="/signup" className="lp-btn lp-btn-lg">
                {h.heroCta}
              </Link>
              <Link href="/contact" className="lp-btn-outline">
                {h.heroSecondary}
              </Link>
            </div>
          </div>

          <div className="lp-hero-visual" aria-hidden>
            <div className="lp-stack">
              <div className="lp-paper back" />
              <div className="lp-paper mid" />
              <div className="lp-paper front">
                <div className="lp-paper-head">
                  <div className="lp-logo-mini">FS</div>
                  <div>
                    <div className="t">Service Agreement</div>
                    <div className="s">Prepared for Acme Partners</div>
                  </div>
                </div>
                <div className="lp-lines">
                  <i />
                  <i />
                  <i className="short" />
                  <i />
                  <i className="short" />
                </div>
                <div className="lp-sign-box">
                  <span className="label">Sign here</span>
                  <span className="sig">sayeed sheikh</span>
                  <div className="meta">
                    <span className="dot" /> Signed · Today 2:14 PM
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-float-card">
              <div className="lp-float-top">
                <span className="pill">Just signed</span>
                <span className="time">2m ago</span>
              </div>
              <strong>Agreement locked in</strong>
              <div className="lp-float-people">
                <span className="av a1">S</span>
                <span className="av a2">A</span>
                <span className="av a3">M</span>
                <span className="who">3 of 3 complete</span>
              </div>
            </div>
          </div>
        </ScrollMeetSplit>
        <div className="lp-wave-break" aria-hidden />
      </section>

      <section className="lp-integ" id="integrations" aria-labelledby="integ-title">
        <ScrollMeetSplit className="lp-integ-inner lp-meet-stack" itemClassName="lp-meet-item" distance={90} stagger={0.08}>
          <p className="lp-integ-kicker">{h.integKicker}</p>
          <h2 id="integ-title">{h.integTitle}</h2>
          <p className="lp-integ-sub">{withEsignUnderline(h.integSub)}</p>
          <Link href="/features" className="lp-integ-link">
            {h.integLink} <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </ScrollMeetSplit>
        <IntegrationsMarquee />
      </section>

      <section className="lp-features" id="features">
        <div className="lp-wrap">
          <ScrollMeetBlock side="left" className="lp-meet-heading">
            <h2 className="lp-h2">{h.featuresTitle}</h2>
          </ScrollMeetBlock>
          <ScrollMeetSplit className="lp-feat-grid lp-meet-grid" itemClassName="lp-meet-item">
            {pillars.map((f) => (
              <article key={f.title} className="lp-feat">
                <div className="lp-feat-ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <Link href="/features" className="lp-text-link">
                  {h.pillarLinkLabel} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>

      <section className="lp-teams" id="teams">
        <div className="lp-wrap">
          <ScrollMeetSplit className="lp-meet-stack lp-section-head" itemClassName="lp-meet-item" distance={100} stagger={0.1}>
            <h2 className="lp-h2">{h.teamsTitle}</h2>
            <p className="lp-section-sub">{h.teamsSub}</p>
          </ScrollMeetSplit>
          <ScrollMeetSplit className="lp-team-grid lp-meet-grid" itemClassName="lp-meet-item" distance={160} stagger={0.12}>
            {TEAMS.map((t) => (
              <article key={t.id} className="lp-team-card" id={t.id}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
                <Link href={`/teams/${t.id}`} className="lp-text-link">
                  {h.teamLinkLabel} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>

      <section className="lp-steps">
        <div className="lp-wrap">
          <ScrollMeetSplit className="lp-meet-stack lp-section-head" itemClassName="lp-meet-item" distance={100} stagger={0.1}>
            <h2 className="lp-h2">{h.stepsTitle}</h2>
            <p className="lp-section-sub">{h.stepsSub}</p>
          </ScrollMeetSplit>
          <ScrollMeetSplit className="lp-steps-grid lp-meet-grid" itemClassName="lp-meet-item" distance={110} stagger={0.1}>
            {STEPS.map((s, i) => (
              <article key={s.title} className="lp-step">
                <span className="lp-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>

      <section className="lp-tools" id="api">
        <ScrollMeetSplit className="lp-wrap lp-tools-inner lp-meet-grid" itemClassName="lp-meet-item" distance={150} stagger={0.15}>
          <div className="lp-tools-copy">
            <h2 className="lp-h2">{h.toolsTitle}</h2>
            <p>{h.toolsBody}</p>
            <div className="lp-hero-ctas">
              <Link href={h.toolsPrimaryHref || "/features"} className="lp-btn">
                {h.toolsPrimaryCta}
              </Link>
              {h.toolsSecondaryHref && !h.toolsSecondaryHref.includes("/developers") ? (
                <Link href={h.toolsSecondaryHref} className="lp-text-link" style={{ marginTop: 0 }}>
                  {h.toolsSecondaryCta} <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="lp-orbit" aria-hidden>
            <div className="lp-orbit-ring" />
            <div className="lp-orbit-core">
              <div className="lp-logo-mini">FS</div>
              <div>
                <span>Business Proposal</span>
                <strong>Ready to sign</strong>
              </div>
            </div>
            {ORBIT_MARKS.map((item, i) => (
              <span
                key={item.name}
                className={`lp-orbit-node n${i}`}
                style={{ color: item.fg, borderColor: `${item.fg}33` }}
              >
                {item.mark}
              </span>
            ))}
          </div>
        </ScrollMeetSplit>
      </section>

      {m.pricingPage.showHighlightRow !== false && (
      <section className="lp-plans" id="pricing">
        <div className="lp-wrap">
          <h2 className="lp-plans-head">{h.plansTitle}</h2>
          <div className="lp-plans-inner">
            <article className="lp-plan-card">
              <p className="eyebrow">{m.pricingPage.essentialsEyebrow}</p>
              <h3>{teamTitle}</h3>
              <p className="price">
                {startsAt} <strong>${teamPrice}</strong>
                <span>{monthSuffix}</span>
              </p>
              <p className="desc">
                {h.planTeamBody ||
                  "Unlimited signatures on a single device. Upgrade to Pro · 5 devices anytime."}
              </p>
              <Link href="/pricing" className="lp-btn">
                {h.heroCta}
              </Link>
            </article>
            <article className="lp-plan-card alt">
              <p className="eyebrow">{m.pricingPage.standardEyebrow}</p>
              <h3>{muscleTitle}</h3>
              <p className="price">
                {startsAt} <strong>${musclePrice}</strong>
                <span>{monthSuffix}</span>
              </p>
              <p className="desc">
                {h.planApiBody ||
                  "Unlimited everything for teams — pick 1 device or up to 5 concurrent devices."}
              </p>
              <Link href="/pricing" className="lp-btn-muted">
                {m.pricingPage.standardCta || "See all plans"}
              </Link>
            </article>
          </div>
        </div>
      </section>
      )}

      <section className="lp-stories">
        <div className="lp-wrap">
          <ScrollMeetBlock side="right" className="lp-meet-heading">
            <h2 className="lp-h2">{h.storiesTitle}</h2>
          </ScrollMeetBlock>
          <ScrollMeetSplit className="lp-story-grid lp-meet-grid" itemClassName="lp-meet-item" distance={130} stagger={0.14}>
            {stories.map((s) => (
              <article key={s.metric} className="lp-story">
                <h3>{s.metric}</h3>
                <p>“{s.quote}”</p>
                <span className="by">{s.by}</span>
              </article>
            ))}
          </ScrollMeetSplit>
        </div>
      </section>

      <section className="lp-bottom-cta">
        <ScrollMeetSplit className="lp-wrap lp-meet-stack lp-bottom-meet" itemClassName="lp-meet-item" distance={80} stagger={0.1}>
          <h2>{h.bottomTitle}</h2>
          <div className="lp-hero-ctas">
            <Link href="/signup" className="lp-btn lp-btn-lg">
              {h.heroCta}
            </Link>
            <Link href="/contact" className="lp-btn-outline">
              {h.heroSecondary}
            </Link>
          </div>
        </ScrollMeetSplit>
      </section>
    </main>
  );
}
