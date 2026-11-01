import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import {
  IconBusywork,
  IconSecure,
  IconTeams,
  IconWorkflow,
} from "@/components/landing/FeatureIcons";
import { IntegrationsMarquee } from "@/components/landing/IntegrationsMarquee";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";
import { getPlans } from "@/lib/plans";

export const dynamic = "force-dynamic";

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
  const [m, site] = await Promise.all([getMarketing(), getSiteSettings()]);
  const h = m.home;
  const STEPS = m.steps;
  const TEAMS = m.teamCards;
  const starter = getPlans(site).find((p) => p.id === "starter");
  const teamPrice = starter ? String(starter.monthly) : h.planTeamPrice;
  const teamTitle = starter?.name || h.planTeamTitle;

  const pillars = [
    { title: h.pillar1Title, body: h.pillar1Body, icon: <IconWorkflow /> },
    { title: h.pillar2Title, body: h.pillar2Body, icon: <IconBusywork /> },
    { title: h.pillar3Title, body: h.pillar3Body, icon: <IconTeams /> },
    { title: h.pillar4Title, body: h.pillar4Body, icon: <IconSecure /> },
  ];

  const stories = [
    { metric: h.story1Metric, quote: h.story1Quote, by: h.story1By, tone: "plum" },
    { metric: h.story2Metric, quote: h.story2Quote, by: h.story2By, tone: "navy" },
    { metric: h.story3Metric, quote: h.story3Quote, by: h.story3By, tone: "violet" },
  ];

  return (
    <main className="lp-page">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <div className="lp-stars lp-hero-in d0" aria-label="5 star rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
              ))}
              <span>{h.starsLabel}</span>
            </div>
            <h1 className="lp-hero-in d1">{h.heroTitle}</h1>
            <p className="lead lp-hero-in d2">{h.heroLead}</p>
            <div className="lp-hero-ctas lp-hero-in d3">
              <Link href="/signup" className="lp-btn lp-btn-lg">
                {h.heroCta}
              </Link>
              <Link href="/contact" className="lp-btn-outline">
                {h.heroSecondary}
              </Link>
            </div>
          </div>

          <div className="lp-hero-visual lp-hero-in d2" aria-hidden>
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
                <span className="pill">In progress</span>
                <span className="time">15 min ago</span>
              </div>
              <strong>2 new signature requests</strong>
              <div className="lp-float-people">
                <span className="av a1">S</span>
                <span className="av a2">J</span>
                <span className="av a3">M</span>
                <span className="who">sayeed sheikh, Jordan +1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-integ" id="integrations" aria-labelledby="integ-title">
        <div className="lp-integ-inner">
          <p className="lp-integ-kicker" data-animate="fade">
            {h.integKicker}
          </p>
          <h2 id="integ-title" data-animate="up">
            {h.integTitle}
          </h2>
          <p className="lp-integ-sub" data-animate="fade">
            {withEsignUnderline(h.integSub)}
          </p>
          <Link href="/features" className="lp-integ-link" data-animate="up">
            {h.integLink} <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
        <IntegrationsMarquee />
      </section>

      <section className="lp-features" id="features">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            {h.featuresTitle}
          </h2>
          <div className="lp-feat-grid" data-animate="stagger">
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
          </div>
        </div>
      </section>

      <section className="lp-teams" id="teams">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            {h.teamsTitle}
          </h2>
          <p className="lp-section-sub" data-animate="fade">
            {h.teamsSub}
          </p>
          <div className="lp-team-grid" data-animate="stagger">
            {TEAMS.map((t) => (
              <article key={t.id} className="lp-team-card" id={t.id}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
                <Link href={`/teams/${t.id}`} className="lp-text-link">
                  {h.teamLinkLabel} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-steps">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            {h.stepsTitle}
          </h2>
          <p className="lp-section-sub" data-animate="fade">
            {h.stepsSub}
          </p>
          <div className="lp-steps-grid" data-animate="stagger">
            {STEPS.map((s, i) => (
              <article key={s.title} className="lp-step">
                <span className="lp-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-tools" id="api">
        <div className="lp-wrap lp-tools-inner">
          <div className="lp-tools-copy" data-animate="left">
            <h2 className="lp-h2">{h.toolsTitle}</h2>
            <p>{h.toolsBody}</p>
            <div className="lp-hero-ctas">
              <Link href={h.toolsPrimaryHref || "/features"} className="lp-btn">
                {h.toolsPrimaryCta}
              </Link>
              <Link href={h.toolsSecondaryHref || "/developers"} className="lp-text-link" style={{ marginTop: 0 }}>
                {h.toolsSecondaryCta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="lp-orbit" data-animate="scale" aria-hidden>
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
        </div>
      </section>

      <section className="lp-plans" id="pricing">
        <div className="lp-wrap">
          <h2 className="lp-plans-head" data-animate="up">
            {h.plansTitle}
          </h2>
          <div className="lp-plans-inner" data-animate="stagger">
            <article className="lp-plan-card">
              <p className="eyebrow">For teams</p>
              <h3>{teamTitle}</h3>
              <p className="price">
                Starts at <strong>${teamPrice}</strong>
                <span>/month</span>
              </p>
              <p className="desc">{h.planTeamBody}</p>
              <Link href="/signup" className="lp-btn">
                {h.heroCta}
              </Link>
            </article>
            <article className="lp-plan-card alt">
              <p className="eyebrow">For developers</p>
              <h3>{h.planApiTitle}</h3>
              <p className="price">
                Starts at <strong>${h.planApiPrice}</strong>
                <span>/month</span>
              </p>
              <p className="desc">{h.planApiBody}</p>
              <Link href={h.toolsSecondaryHref || "/developers"} className="lp-btn-muted">
                {h.toolsSecondaryCta}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-stories">
        <div className="lp-wrap">
          <h2 className="lp-h2" data-animate="up">
            {h.storiesTitle}
          </h2>
          <div className="lp-story-grid" data-animate="stagger">
            {stories.map((s) => (
              <article key={s.metric} className={`lp-story ${s.tone}`}>
                <h3>{s.metric}</h3>
                <p>“{s.quote}”</p>
                <span className="by">{s.by}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-bottom-cta">
        <div className="lp-wrap" data-animate="up">
          <h2>{h.bottomTitle}</h2>
          <div className="lp-hero-ctas">
            <Link href="/signup" className="lp-btn lp-btn-lg">
              {h.heroCta}
            </Link>
            <Link href="/contact" className="lp-btn-outline">
              {h.heroSecondary}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
