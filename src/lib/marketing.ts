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
    /** Homepage link labels */
    pillarLinkLabel: string;
    teamLinkLabel: string;
    toolsPrimaryCta: string;
    toolsSecondaryCta: string;
    toolsPrimaryHref: string;
    toolsSecondaryHref: string;
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
  /** Full /pricing page layout labels (plans themselves live in OrgSettings.plans) */
  pricingPage: {
    essentialsEyebrow: string;
    standardEyebrow: string;
    standardCta: string;
    apiKicker: string;
    apiLinkLabel: string;
    apiLinkHref: string;
    compareTitle: string;
    compareCta: string;
    startsAtLabel: string;
    monthSuffix: string;
    showHighlightRow: boolean;
    showApiBlock: boolean;
    showCompare: boolean;
  };
};

export const defaultMarketing: MarketingSite = {
  home: {
    heroTitle: "Signatures that keep pace with your day",
    heroLead:
      "Flowy Sign - eSignature, based in Austell GA, USA, helps you request signatures, track who still needs to sign, and finish paperwork without the usual chase.",
    heroCta: "Open a free workspace",
    heroSecondary: "See Pricing",
    starsLabel: "Trusted by busy teams",
    integKicker: "Integrations",
    integTitle: "Plug Flowy Sign into your stack",
    integSub: "Keep signing next to the tools your team already opens every morning.",
    integLink: "Browse integrations",
    featuresTitle: "Less waiting. More signed work.",
    teamsTitle: "Workflows that fit the job",
    teamsSub: "Sales, HR, legal, and ops each get a path that matches how they close agreements.",
    stepsTitle: "From upload to signed copy",
    stepsSub: "Four short moves—then Flowy Sign - eSignature handles the rest.",
    toolsTitle: "Stay in the apps you already love",
    toolsBody:
      "Hook up storage, chat, and CRM—or drop signing into your product with our API. Prefer details first? Check Pricing or About Us anytime.",
    plansTitle: "Honest packages, no guesswork",
    storiesTitle: "Why teams stay with Flowy Sign",
    bottomTitle: "Ready for a quieter signature workflow?",
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
    pillarLinkLabel: "Learn more",
    teamLinkLabel: "See the solution",
    toolsPrimaryCta: "Explore integrations",
    toolsSecondaryCta: "Developers",
    toolsPrimaryHref: "/features",
    toolsSecondaryHref: "/developers",
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
    title: "Pay for what your team actually ships",
    lead:
      "Flowy Sign - eSignature Pricing stays readable on purpose—free to try, room to grow, and a Contact line when you need a custom fit from Austell GA, USA.",
    cta: "Start free",
    secondary: "Contact sales",
  },
  pricingPage: {
    essentialsEyebrow: "Essentials",
    standardEyebrow: "Standard",
    standardCta: "Get started",
    apiKicker: "API plans",
    apiLinkLabel: "Explore developers →",
    apiLinkHref: "/developers",
    compareTitle: "Compare plans",
    compareCta: "Get started",
    startsAtLabel: "Starts at",
    monthSuffix: "/month",
    showHighlightRow: true,
    showApiBlock: true,
    showCompare: true,
  },
  help: {
    kicker: "Help center",
    title: "Frequently asked questions",
    lead: "Quick answers about sending, signing, fax, billing, and the API.",
    cta: "Contact support",
    secondary: "Create account",
  },
  about: {
    kicker: "About Us",
    title: "A signature studio with Georgia roots",
    lead:
      "About Us is simple: Flowy Sign - eSignature was shaped in Austell GA, USA to replace messy email attachments with a clean send-and-sign path you can trust.",
    cta: "Create free account",
    secondary: "View Pricing",
  },
  contact: {
    kicker: "Contact",
    title: "Say hello—we answer from Austell",
    lead:
      "Use Contact for product help, partnership ideas, or plan questions about Flowy Sign - eSignature. We’re in Austell GA, USA; Pricing and About Us are one click away if you need context first.",
    cta: "Email the team",
    secondary: "Open Pricing",
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
    kicker: "Terms & Conditions",
    title: "How we work together on Flowy Sign",
    lead:
      "Read these Terms & Conditions before you rely on Flowy Sign - eSignature in production. Questions? Contact our Austell GA, USA team—About Us and Pricing are linked in the footer with this page.",
    cta: "Contact",
    secondary: "About Us",
  },
  navWhy: "Why Flowy Sign",
  navFeatures: "Features",
  navTeams: "Teams",
  navDevelopers: "Developers",
  navPricing: "Pricing",
  navSupport: "Support",
  navLogin: "Log in",
  navGetStarted: "Get started",
  footerTagline: "Flowy Sign - eSignature · Austell GA, USA",
  footerLinks: [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
  steps: [
    { title: "Bring your file", body: "Upload from your device or pull a draft you already trust." },
    { title: "Mark the spots", body: "Drop signature, date, and text fields where people need to act." },
    { title: "Invite to sign", body: "Recipients open a secure link—no Flowy Sign account required." },
    { title: "Keep the record", body: "Finished copies and status live in your Flowy Sign - eSignature workspace." },
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
    {
      title: "Where we stand",
      body: "Flowy Sign - eSignature calls Austell GA, USA home—small enough to listen, serious enough to ship reliable signing tools.",
    },
    {
      title: "What ships from here",
      body: "Signature requests, reusable templates, team seats, online fax, and an API so your product can request signatures without reinventing the wheel.",
    },
    {
      title: "How we stay clear",
      body: "Pricing shows the numbers up front, Contact reaches a real inbox, and Terms & Conditions sit in the footer whenever you need them.",
      href: "/pricing",
      linkLabel: "Check Pricing",
    },
  ],
  contactCards: [
    { title: "Brand", body: "Flowy Sign - eSignature" },
    { title: "Office", body: "Austell GA, USA" },
    { title: "Inbox", body: "help@flowysign.com", href: "mailto:help@flowysign.com", linkLabel: "Write us" },
    {
      title: "Billing questions",
      body: "Scan Pricing for plan limits, then Contact us if you need seats, API volume, or a guided walkthrough.",
      href: "/pricing",
      linkLabel: "Go to Pricing",
    },
    {
      title: "Who we are",
      body: "About Us covers our story. Come back to Contact when you want a direct reply from the team.",
      href: "/about",
      linkLabel: "Visit About Us",
    },
    {
      title: "Rules of use",
      body: "Terms & Conditions live in the footer of every Flowy Sign - eSignature page for quick reference.",
      href: "/terms",
      linkLabel: "Open Terms & Conditions",
    },
  ],
  pressCards: [
    {
      title: "Snapshot",
      body: "Flowy Sign - eSignature is an Austell GA, USA product for sending signature requests and online faxes without the paperwork grind.",
    },
    {
      title: "Product line",
      body: "Web workspace for eSign, templates, roles, billing, fax, and a REST API for embedded flows.",
    },
    {
      title: "Media desk",
      body: "Email help@flowysign.com with “Press” in the subject—or use Contact for partnership notes.",
      href: "/contact",
      linkLabel: "Contact",
    },
  ],
  privacyBody:
    "{{brand}} collects the account details you submit (name, email, company), the files you upload to send for signature or fax, and the operational signals we need to keep the service stable.\n\nWe use that information to run eSignature and fax features, answer support requests, harden reliability, and share workspace notices. We do not sell personal data.\n\nFiles and accounts are protected with encryption in transit and at rest. Only systems and people required to operate Flowy Sign can access them.\n\nPrivacy questions? Email {{email}}. We operate from {{address}}.",
  termsBody:
    "Welcome to {{brand}}. These Terms & Conditions govern your use of our eSignature and related services operated from {{address}}.\n\nYou confirm that documents you upload are yours to share, that you will protect your credentials, and that you will use the product only for lawful signing and related work. Do not invade another customer’s workspace or push harmful material through the platform.\n\nMarks captured in {{brand}} are intended to show clear party intent. Legal effect can differ by place and industry—get advice from your own counsel when the stakes are regulated.\n\nFees and limits appear on Pricing. Product or account help goes through Contact at {{email}}. Company context is on About Us. You will always find Terms & Conditions in the site footer.",
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
    pricingPage: {
      ...defaultMarketing.pricingPage,
      ...(p.pricingPage || {}),
    },
  };
}
