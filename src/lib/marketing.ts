/** Admin-editable marketing site copy (Flowy Sign pages). */

import {
  FEATURE_PAGES,
  TEAM_PAGES,
  type DetailPage,
} from "@/components/marketing/page-content";

export type PageHero = {
  kicker: string;
  title: string;
  lead: string;
  cta: string;
  secondary: string;
};

export type FaqItem = { q: string; a: string };
export type StepItem = { title: string; body: string };
export type TeamCard = { id: string; title: string; body: string };
export type TextCard = { title: string; body: string; href?: string; linkLabel?: string };

export type MarketingSite = {
  home: {
    heroTitle: string;
    heroLead: string;
    heroCta: string;
    heroSecondary: string;
    starsLabel: string;
    integKicker: string;
    integTitle: string;
    integSub: string;
    integLink: string;
    featuresTitle: string;
    teamsTitle: string;
    teamsSub: string;
    stepsTitle: string;
    stepsSub: string;
    toolsTitle: string;
    toolsBody: string;
    plansTitle: string;
    storiesTitle: string;
    bottomTitle: string;
    pillar1Title: string;
    pillar1Body: string;
    pillar2Title: string;
    pillar2Body: string;
    pillar3Title: string;
    pillar3Body: string;
    pillar4Title: string;
    pillar4Body: string;
    planTeamTitle: string;
    planTeamPrice: string;
    planTeamBody: string;
    planApiTitle: string;
    planApiPrice: string;
    planApiBody: string;
    story1Metric: string;
    story1Quote: string;
    story1By: string;
    story2Metric: string;
    story2Quote: string;
    story2By: string;
    story3Metric: string;
    story3Quote: string;
    story3By: string;
  };
  why: PageHero;
  features: PageHero;
  teams: PageHero;
  developers: PageHero;
  pricing: PageHero;
  help: PageHero;
  about: PageHero;
  contact: PageHero;
  press: PageHero;
  privacy: PageHero;
  terms: PageHero;
  navWhy: string;
  navFeatures: string;
  navTeams: string;
  navDevelopers: string;
  navPricing: string;
  navSupport: string;
  navLogin: string;
  navGetStarted: string;
  footerTagline: string;
  /** Footer links only — add more from admin anytime */
  footerLinks: { label: string; href: string }[];
  /** Homepage workflow steps */
  steps: StepItem[];
  /** Homepage team cards */
  teamCards: TeamCard[];
  /** Help / FAQ */
  faqs: FaqItem[];
  /** Developers feature grid */
  developersBlocks: StepItem[];
  /** About / contact / press cards */
  aboutCards: TextCard[];
  contactCards: TextCard[];
  pressCards: TextCard[];
  /** Legal body paragraphs (use {{brand}} {{address}} {{email}}) */
  privacyBody: string;
  termsBody: string;
  /** Feature & team detail pages */
  featurePages: DetailPage[];
  teamPages: DetailPage[];
};

export const defaultMarketing: MarketingSite = {
  home: {
    heroTitle: "Simplify eSignatures for every team",
    heroLead:
      "Flowy Sign - eSignature makes it easy to send, sign, and manage agreements without the extra complexity—so work moves faster from request to signature.",
    heroCta: "Start a free trial",
    heroSecondary: "Get a demo",
    starsLabel: "Loved by growing teams",
    integKicker: "Integrations",
    integTitle: "Flowy Sign meets you where you work",
    integSub: "Integrate Flowy Sign eSignatures with the tools you know and use.",
    integLink: "Learn more about our integrations",
    featuresTitle: "An easier way to manage agreements",
    teamsTitle: "Built for how your team works",
    teamsSub: "Find the eSignature workflow made for your industry.",
    stepsTitle: "Go from sent to signed, faster",
    stepsSub: "Your digital signature workflow in just a few steps.",
    toolsTitle: "Works with the tools you already use",
    toolsBody:
      "Connect Drive, Slack, CRM, and email—or embed signing with the Flowy Sign API so agreements happen inside your product.",
    plansTitle: "Choose the right solution for you",
    storiesTitle: "See why teams pick Flowy Sign",
    bottomTitle: "Ready to make eSignatures easier for your team?",
    pillar1Title: "Fits into existing workflows",
    pillar1Body: "Send signature requests from everyday tools, with fewer manual steps along the way.",
    pillar2Title: "Start in minutes",
    pillar2Body: "Get up and running fast with an intuitive experience that is easy for your team to adopt.",
    pillar3Title: "Work across departments",
    pillar3Body: "Support sales contracts, NDAs, offer letters, creative approvals, and more.",
    pillar4Title: "Secure by design",
    pillar4Body: "Help protect each agreement with enterprise-grade security and audit trails.",
    planTeamTitle: "Send agreements with Flowy Sign",
    planTeamPrice: "15",
    planTeamBody: "Share documents, collect electronic signatures, and store completed copies.",
    planApiTitle: "Integrate eSignatures with the API",
    planApiPrice: "75",
    planApiBody: "Build secure, branded signing directly into your website or app.",
    story1Metric: "$80K saved a year",
    story1Quote:
      "Sign saves us around four minutes per document. That time adds up across thousands of agreements.",
    story1By: "Ops lead, services firm",
    story2Metric: "Weeks → minutes",
    story2Quote: "Customer contracts that used to take weeks now close in a single afternoon.",
    story2By: "Sales director",
    story3Metric: "Easily verify signatures",
    story3Quote: "Audit trails mean we always know who signed, when, and from where.",
    story3By: "Legal counsel",
  },
  why: {
    kicker: "Why Flowy Sign",
    title: "Simplify eSignatures without the busywork",
    lead: "Send, sign, fax, and track agreements in one workspace built for modern teams.",
    cta: "Start a free trial",
    secondary: "Explore features",
  },
  features: {
    kicker: "Features",
    title: "Everything you need to send and sign",
    lead: "From templates to audit trails—Flowy Sign keeps agreements moving without paper or busywork.",
    cta: "Start a free trial",
    secondary: "API docs",
  },
  teams: {
    kicker: "Teams",
    title: "Built for how your team works",
    lead: "Find the eSignature workflow made for your industry—same secure workspace for every department.",
    cta: "Start a free trial",
    secondary: "View pricing",
  },
  developers: {
    kicker: "Flowy Sign API",
    title: "Build eSignatures into your product",
    lead: "Create signature requests, track status, and automate fax with a clean REST API.",
    cta: "Get API access",
    secondary: "View docs",
  },
  pricing: {
    kicker: "Pricing",
    title: "Unlimited signature requests with no hidden fees",
    lead: "Start free, then pick the plan that fits your team or API needs.",
    cta: "Start a free trial",
    secondary: "Contact sales",
  },
  help: {
    kicker: "Help center",
    title: "Frequently asked questions",
    lead: "Quick answers about sending, signing, fax, billing, and the API.",
    cta: "Contact support",
    secondary: "Create account",
  },
  about: {
    kicker: "About us",
    title: "Flowy Sign - eSignature",
    lead: "Helping teams send, sign, and manage documents from Austell GA, USA.",
    cta: "Start a free trial",
    secondary: "Press",
  },
  contact: {
    kicker: "Contact",
    title: "Get in touch",
    lead: "Sales, support, and partnership questions—we are based in Austell GA, USA.",
    cta: "Email us",
    secondary: "Help center",
  },
  press: {
    kicker: "Press",
    title: "Flowy Sign in the news",
    lead: "Brand assets, company facts, and media contact for Flowy Sign - eSignature.",
    cta: "Media inquiries",
    secondary: "About us",
  },
  privacy: {
    kicker: "Legal",
    title: "Privacy Policy",
    lead: "How we collect, use, and protect information when you use Flowy Sign.",
    cta: "Contact us",
    secondary: "Terms",
  },
  terms: {
    kicker: "Legal",
    title: "Terms & Conditions",
    lead: "By using Flowy Sign - eSignature, you agree to these terms.",
    cta: "Privacy Policy",
    secondary: "Questions",
  },
  navWhy: "Why Flowy Sign",
  navFeatures: "Features",
  navTeams: "Teams",
  navDevelopers: "Developers",
  navPricing: "Pricing",
  navSupport: "Support",
  navLogin: "Log in",
  navGetStarted: "Get started",
  footerTagline: "Austell GA, USA",
  footerLinks: [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
  steps: [
    { title: "Choose your file", body: "Start with a document from Drive, email, or your device." },
    { title: "Prep for signature", body: "Add signers, fields, and a personalized message." },
    { title: "Send the agreement", body: "Recipients review and sign securely—no account required." },
    { title: "Save automatically", body: "Completed copies land back in your Flowy Sign workspace." },
  ],
  teamCards: [
    { id: "sales", title: "Sales", body: "Close deals faster by sending contracts for signature straight from your CRM." },
    { id: "hr", title: "Human resources", body: "Get hiring and onboarding paperwork signed without the back-and-forth." },
    { id: "legal", title: "Legal", body: "Standardize NDAs and MSAs with templates your counsel can trust." },
    { id: "finance", title: "Finance", body: "Get vendor forms and approvals signed without spreadsheet chaos." },
    { id: "real-estate", title: "Real estate", body: "Move deals forward with contracts that sign, file, and track themselves." },
    { id: "ops", title: "Operations", body: "Fax and eSign from one place so field teams stay unblocked." },
  ],
  faqs: [
    {
      q: "How do I send a document for signature?",
      a: "Create an account, click Sign documents, upload your file, add recipients, place fields, and send. Signers get a secure link—no account required.",
    },
    {
      q: "How do I send a fax online?",
      a: "Open Send fax, enter the destination number, attach your document, and queue the fax from your Flowy Sign workspace.",
    },
    {
      q: "Do signers need to pay?",
      a: "No. Recipients open the email link, review, and sign. They never need a paid Flowy Sign account.",
    },
    {
      q: "Are electronic signatures legally binding?",
      a: "Flowy Sign is designed to capture clear evidence of agreement with audit trails. Enforceability can vary by jurisdiction—consult your counsel for regulated cases.",
    },
    {
      q: "What is the Flowy Sign API?",
      a: "A REST API to create signature requests, track status, and automate fax from your own product. See the Developers page for details.",
    },
    {
      q: "Where are you based?",
      a: "Flowy Sign - eSignature is based in Austell, GA, USA. Email help@flowysign.com for support.",
    },
  ],
  developersBlocks: [
    { title: "Signature requests", body: "Create, send, and retrieve agreements with fields, order, and reminders." },
    { title: "Webhooks", body: "Get notified when documents are viewed, signed, declined, or completed." },
    { title: "Fax + sign", body: "Queue online faxes alongside eSign flows from one API surface." },
    { title: "Audit trail", body: "Every action is logged so you can prove who signed, when, and from where." },
  ],
  aboutCards: [
    { title: "Where we work", body: "Austell GA, USA" },
    {
      title: "What we build",
      body: "eSignature requests, online fax, templates, team workspaces, billing, and a developer API.",
    },
    {
      title: "Who we help",
      body: "Sales, HR, legal, finance, real estate, and ops teams that want paperless agreements.",
      href: "/teams",
      linkLabel: "Explore teams",
    },
  ],
  contactCards: [
    { title: "Company", body: "Flowy Sign - eSignature" },
    { title: "Address", body: "Austell GA, USA" },
    { title: "Email", body: "help@flowysign.com", href: "mailto:help@flowysign.com", linkLabel: "Send email" },
    {
      title: "Sales",
      body: "Ask about team plans, API volume, or a product demo.",
      href: "/pricing",
      linkLabel: "View pricing",
    },
    {
      title: "Support",
      body: "Account, sending, and signing help for existing customers.",
      href: "/help",
      linkLabel: "Open FAQ",
    },
    { title: "Press", body: "Media and partnership requests.", href: "/press", linkLabel: "Press kit" },
  ],
  pressCards: [
    {
      title: "Company",
      body: "Flowy Sign - eSignature helps teams send signature requests and online faxes from Austell, GA, USA.",
    },
    {
      title: "Product",
      body: "Web app for eSign + fax, templates, team roles, billing, and a REST API for embedded signing.",
    },
    {
      title: "Contact",
      body: "For press and partnership requests, email help@flowysign.com with “Press” in the subject line.",
      href: "/contact",
      linkLabel: "Contact",
    },
  ],
  privacyBody:
    "We collect account details you provide (such as name, email, and company), documents you upload to send for signature or fax, and basic usage data needed to operate the service.\n\nWe use this information to deliver eSignature and fax features, provide support, improve reliability, and communicate about your workspace. We do not sell your personal information.\n\nDocuments and account data are protected with industry-standard encryption in transit and at rest. Access is limited to authorized personnel and systems required to run Flowy Sign.\n\nFor privacy questions, contact {{email}}. Our office is in {{address}}.",
  termsBody:
    "Welcome to {{brand}}. By accessing or using our eSignature and related services, you agree to these Terms & Conditions.\n\nYou are responsible for the accuracy of documents you upload and for obtaining any permissions required before requesting signatures. Do not use the service for unlawful content or unauthorized access to others’ accounts.\n\nElectronic signatures collected through the platform are intended to evidence agreement between parties. Legal enforceability may vary by jurisdiction; consult your counsel for regulated use cases.\n\nService is provided from {{address}}. For questions, contact {{email}}.",
  featurePages: FEATURE_PAGES,
  teamPages: TEAM_PAGES,
};

function mergeDetailPages(defaults: DetailPage[], partial?: DetailPage[] | null): DetailPage[] {
  if (!partial?.length) return defaults.map((d) => ({ ...d, sections: d.sections.map((s) => ({ ...s })) }));
  const bySlug = new Map(partial.map((p) => [p.slug, p]));
  const merged = defaults.map((d) => {
    const o = bySlug.get(d.slug);
    if (!o) return { ...d, sections: d.sections.map((s) => ({ ...s })) };
    bySlug.delete(d.slug);
    return {
      ...d,
      ...o,
      sections:
        o.sections?.length > 0
          ? o.sections.map((s) => ({ title: s.title || "", body: s.body || "" }))
          : d.sections.map((s) => ({ ...s })),
    };
  });
  for (const extra of bySlug.values()) {
    merged.push({
      ...extra,
      sections: (extra.sections || []).map((s) => ({ title: s.title || "", body: s.body || "" })),
    });
  }
  return merged;
}

function mergeList<T extends Record<string, unknown>>(defaults: T[], partial?: T[] | null): T[] {
  if (!partial?.length) return defaults.map((d) => ({ ...d }));
  return partial.map((item, i) => ({ ...(defaults[i] || {}), ...item }));
}

export function fillPlaceholders(
  text: string,
  vars: { brand?: string; address?: string; email?: string },
) {
  return text
    .replaceAll("{{brand}}", vars.brand || "Flowy Sign - eSignature")
    .replaceAll("{{address}}", vars.address || "Austell GA, USA")
    .replaceAll("{{email}}", vars.email || "help@flowysign.com");
}

export function mergeMarketing(partial?: Partial<MarketingSite> | null): MarketingSite {
  const p = partial || {};
  return {
    ...defaultMarketing,
    ...p,
    home: { ...defaultMarketing.home, ...(p.home || {}) },
    why: { ...defaultMarketing.why, ...(p.why || {}) },
    features: { ...defaultMarketing.features, ...(p.features || {}) },
    teams: { ...defaultMarketing.teams, ...(p.teams || {}) },
    developers: { ...defaultMarketing.developers, ...(p.developers || {}) },
    pricing: { ...defaultMarketing.pricing, ...(p.pricing || {}) },
    help: { ...defaultMarketing.help, ...(p.help || {}) },
    about: { ...defaultMarketing.about, ...(p.about || {}) },
    contact: { ...defaultMarketing.contact, ...(p.contact || {}) },
    press: { ...defaultMarketing.press, ...(p.press || {}) },
    privacy: { ...defaultMarketing.privacy, ...(p.privacy || {}) },
    terms: { ...defaultMarketing.terms, ...(p.terms || {}) },
    footerLinks:
      p.footerLinks && p.footerLinks.length > 0
        ? p.footerLinks.map((l) => ({
            label: l.label || "",
            href: l.href || "/",
          }))
        : defaultMarketing.footerLinks.map((l) => ({ ...l })),
    steps: mergeList(defaultMarketing.steps, p.steps),
    teamCards: mergeList(defaultMarketing.teamCards, p.teamCards),
    faqs: p.faqs?.length ? p.faqs.map((f) => ({ q: f.q || "", a: f.a || "" })) : defaultMarketing.faqs.map((f) => ({ ...f })),
    developersBlocks: mergeList(defaultMarketing.developersBlocks, p.developersBlocks),
    aboutCards: p.aboutCards?.length
      ? p.aboutCards.map((c) => ({ ...c }))
      : defaultMarketing.aboutCards.map((c) => ({ ...c })),
    contactCards: p.contactCards?.length
      ? p.contactCards.map((c) => ({ ...c }))
      : defaultMarketing.contactCards.map((c) => ({ ...c })),
    pressCards: p.pressCards?.length
      ? p.pressCards.map((c) => ({ ...c }))
      : defaultMarketing.pressCards.map((c) => ({ ...c })),
    privacyBody: p.privacyBody ?? defaultMarketing.privacyBody,
    termsBody: p.termsBody ?? defaultMarketing.termsBody,
    featurePages: mergeDetailPages(defaultMarketing.featurePages, p.featurePages),
    teamPages: mergeDetailPages(defaultMarketing.teamPages, p.teamPages),
  };
}
