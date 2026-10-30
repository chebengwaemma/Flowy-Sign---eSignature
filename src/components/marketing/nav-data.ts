export type NavLink = {
  href: string;
  title: string;
  desc: string;
};

export const WHY_LINKS: NavLink[] = [
  {
    href: "/features/templates",
    title: "Choose or create templates",
    desc: "Reuse templates for repeat agreements",
  },
  {
    href: "/features/pdf",
    title: "Fill and sign PDFs",
    desc: "Fill, sign, and send PDFs fast",
  },
  {
    href: "/features/contracts",
    title: "Complete online contracts",
    desc: "Finalize contracts without any paper",
  },
  {
    href: "/features/manage",
    title: "Document management",
    desc: "Store and organize signed documents",
  },
  {
    href: "/features/fax",
    title: "Online fax",
    desc: "Send and receive faxes from your workspace",
  },
  {
    href: "/features",
    title: "Explore features",
    desc: "See everything Flowy Sign can do",
  },
];

export const FEATURE_LINKS: NavLink[] = [
  {
    href: "/features/workflow",
    title: "Signature workflows",
    desc: "Send, track, and finish requests in one place",
  },
  {
    href: "/features/templates",
    title: "Templates",
    desc: "Prep fields once and reuse forever",
  },
  {
    href: "/features/audit",
    title: "Audit trail",
    desc: "Proof of every view, sign, and change",
  },
  {
    href: "/features/security",
    title: "Security",
    desc: "Encrypted delivery and access controls",
  },
  {
    href: "/features/workflow",
    title: "Integrations",
    desc: "Connect Drive, Slack, CRM, and email",
  },
  {
    href: "/developers",
    title: "API & embed",
    desc: "Build signing into your own product",
  },
];

export const TEAM_LINKS: NavLink[] = [
  { href: "/teams/sales", title: "Sales", desc: "Close deals faster with eSignatures" },
  {
    href: "/teams/hr",
    title: "Human resources",
    desc: "Onboard employees with signed paperwork",
  },
  {
    href: "/teams/legal",
    title: "Legal",
    desc: "Standardize NDAs and MSAs with templates",
  },
  {
    href: "/teams/finance",
    title: "Finance",
    desc: "Get vendor forms signed without chaos",
  },
  {
    href: "/teams/real-estate",
    title: "Real estate",
    desc: "Close deals digitally on any device",
  },
  {
    href: "/teams/ops",
    title: "Operations",
    desc: "Fax and eSign from one workspace",
  },
];

export const PRICING_LINKS: NavLink[] = [
  {
    href: "/pricing#essentials",
    title: "Essentials",
    desc: "Starts at $15/mo — unlimited templates for individuals",
  },
  {
    href: "/pricing#standard",
    title: "Standard",
    desc: "Team roles, branding, and bulk send",
  },
  {
    href: "/pricing#api",
    title: "API plans",
    desc: "Starts at $75/mo — embed signing in your app",
  },
  {
    href: "/contact",
    title: "Contact sales",
    desc: "Custom volume and enterprise needs",
  },
];
