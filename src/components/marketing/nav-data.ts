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

/** Static fallback — prefer buildPricingLinks() from live OrgSettings plans */
export const PRICING_LINKS: NavLink[] = [
  {
    href: "/pricing#essentials",
    title: "Essentials",
    desc: "Individual plans with signature requests and templates",
  },
  {
    href: "/pricing#standard",
    title: "Standard",
    desc: "Team roles, branding, and bulk send",
  },
  {
    href: "/pricing#api",
    title: "API plans",
    desc: "Embed signing in your app",
  },
  {
    href: "/contact",
    title: "Contact sales",
    desc: "Custom volume and enterprise needs",
  },
];

export function buildPricingLinks(
  plans: { id: string; name: string; monthly: number; visible?: boolean }[],
  apiPriceLabel?: string,
): NavLink[] {
  const paid = (plans || []).filter((p) => p.visible !== false && p.id !== "free");
  const essentials = paid[0];
  const standard = paid[1] || paid[0];
  return [
    {
      href: "/pricing#essentials",
      title: essentials?.name || "Essentials",
      desc: essentials
        ? `Starts at $${essentials.monthly}/mo — signature requests and templates`
        : PRICING_LINKS[0].desc,
    },
    {
      href: "/pricing#standard",
      title: standard?.name || "Standard",
      desc: standard
        ? `From $${standard.monthly}/mo — team roles, branding, and bulk send`
        : PRICING_LINKS[1].desc,
    },
    {
      href: "/pricing#api",
      title: "API plans",
      desc: apiPriceLabel
        ? `Starts at $${apiPriceLabel}/mo — embed signing in your app`
        : PRICING_LINKS[2].desc,
    },
    PRICING_LINKS[3],
  ];
}
