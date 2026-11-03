export type DetailPage = {
  slug: string;
  kicker: string;
  title: string;
  lead: string;
  sections: { title: string; body: string }[];
  related?: { href: string; title: string; desc: string }[];
};

export const FEATURE_PAGES: DetailPage[] = [
  {
    slug: "templates",
    kicker: "Features",
    title: "Choose or create templates",
    lead: "Prep fields once on NDAs, offers, and contracts—then reuse them for every send.",
    sections: [
      {
        title: "Build once, send forever",
        body: "Save signature blocks, dates, and text fields on a reusable template so your team never starts from a blank PDF again.",
      },
      {
        title: "Stay on brand",
        body: "Keep messaging and layout consistent across every agreement your org sends.",
      },
      {
        title: "Faster follow-ups",
        body: "Launch a new request in seconds from a template gallery instead of redrawing fields.",
      },
    ],
  },
  {
    slug: "pdf",
    kicker: "Features",
    title: "Fill and sign PDFs",
    lead: "Upload a PDF, place fields, and send for signature without printing or scanning.",
    sections: [
      {
        title: "Any PDF, ready to sign",
        body: "Drop in contracts, applications, and forms. Add signature, initials, date, and checkbox fields.",
      },
      {
        title: "Signers need no account",
        body: "Recipients open a secure link, complete fields, and finish on desktop or phone.",
      },
      {
        title: "Completed copies for everyone",
        body: "You and your signers automatically get the finished PDF with a clear audit trail.",
      },
    ],
  },
  {
    slug: "contracts",
    kicker: "Features",
    title: "Complete online contracts",
    lead: "Finalize contracts without paper, printers, or courier delays.",
    sections: [
      {
        title: "From draft to done",
        body: "Add parties, set signing order, and track who still needs to sign in one workspace.",
      },
      {
        title: "Reminders built in",
        body: "Automatic nudges keep deals moving when someone stalls.",
      },
      {
        title: "Legally clear records",
        body: "Time-stamped actions help you show what happened on each agreement.",
      },
    ],
  },
  {
    slug: "manage",
    kicker: "Features",
    title: "Document management",
    lead: "Store and organize signed documents with searchable status and history.",
    sections: [
      {
        title: "One place for every agreement",
        body: "See pending, completed, and declined requests without digging through email.",
      },
      {
        title: "Find anything fast",
        body: "Filter by title, recipient, or status so ops and legal stay aligned.",
      },
      {
        title: "Download when you need it",
        body: "Export completed PDFs and audit details for your records.",
      },
    ],
  },
  {
    slug: "fax",
    kicker: "Features",
    title: "Online fax",
    lead: "Send and receive faxes from the same workspace you use for eSignatures.",
    sections: [
      {
        title: "No machine required",
        body: "Queue outbound faxes with attachments and watch delivery status online.",
      },
      {
        title: "Inbound in your inbox",
        body: "Collect inbound pages and keep them next to related signature requests.",
      },
      {
        title: "Built for ops teams",
        body: "Field and office staff share one Flowy Sign workspace for fax and sign.",
      },
    ],
  },
  {
    slug: "workflow",
    kicker: "Features",
    title: "Signature workflows",
    lead: "Send, track, and finish signature requests in one calm workflow.",
    sections: [
      {
        title: "Sequential or parallel",
        body: "Route signers in order or allow everyone to sign at once—your choice.",
      },
      {
        title: "Live status",
        body: "Know who opened, who signed, and who still needs a reminder.",
      },
      {
        title: "Integrations-ready",
        body: "Connect Drive, Slack, CRM, and email—or embed with the API.",
      },
    ],
  },
  {
    slug: "audit",
    kicker: "Features",
    title: "Audit trail",
    lead: "Proof of every view, signature, and change on the document.",
    sections: [
      {
        title: "Complete history",
        body: "See when the request was sent, viewed, signed, or declined.",
      },
      {
        title: "Share with confidence",
        body: "Export or attach the trail when finance or legal needs evidence.",
      },
      {
        title: "Built into every request",
        body: "No extra setup—audit data is captured automatically.",
      },
    ],
  },
  {
    slug: "security",
    kicker: "Features",
    title: "Security",
    lead: "Encrypted delivery and controls designed for business agreements.",
    sections: [
      {
        title: "Protect in transit and at rest",
        body: "Sensitive documents travel over encrypted connections and stay protected in storage.",
      },
      {
        title: "Access with intention",
        body: "Only invited recipients get the signing link for your request.",
      },
      {
        title: "Enterprise-minded controls",
        body: "Team roles and workspace settings help admins keep modules and access tidy.",
      },
    ],
  },
];

export const TEAM_PAGES: DetailPage[] = [
  {
    slug: "sales",
    kicker: "Teams",
    title: "eSignatures for Sales",
    lead: "Close deals faster by sending contracts for signature straight from your workflow.",
    sections: [
      {
        title: "Ship quotes same day",
        body: "Turn proposals into signature-ready requests without leaving your sales process.",
      },
      {
        title: "See who’s stalling",
        body: "Track opens and completions so reps know when to follow up.",
      },
      {
        title: "Keep CRM clean",
        body: "Completed agreements and status stay visible for handoff to CS and finance.",
      },
    ],
  },
  {
    slug: "hr",
    kicker: "Teams",
    title: "eSignatures for Human Resources",
    lead: "Onboard employees with signed paperwork—without the back-and-forth.",
    sections: [
      {
        title: "Offer letters in minutes",
        body: "Templates keep every hire consistent while still feeling personal.",
      },
      {
        title: "Policy acknowledgments",
        body: "Collect signatures on handbooks and compliance docs at scale.",
      },
      {
        title: "Cleaner employee files",
        body: "Store completed packets with audit history for HRIS or audits later.",
      },
    ],
  },
  {
    slug: "legal",
    kicker: "Teams",
    title: "eSignatures for Legal",
    lead: "Standardize NDAs and MSAs with templates your counsel can trust.",
    sections: [
      {
        title: "Approved language, reusable",
        body: "Lock in field layouts on vetted templates so teams don’t freestyle contracts.",
      },
      {
        title: "Visibility without chaos",
        body: "See request status without joining every email thread.",
      },
      {
        title: "Evidence when needed",
        body: "Audit trails support internal reviews and counterparty questions.",
      },
    ],
  },
  {
    slug: "finance",
    kicker: "Teams",
    title: "eSignatures for Finance",
    lead: "Get vendor forms and approvals signed without spreadsheet chaos.",
    sections: [
      {
        title: "Vendor packets that finish",
        body: "Send W-9s, MSAs, and onboarding forms with reminders baked in.",
      },
      {
        title: "Clear ownership",
        body: "Know which documents are waiting on which party.",
      },
      {
        title: "Archive completed work",
        body: "Keep signed copies organized for month-end and audits.",
      },
    ],
  },
  {
    slug: "real-estate",
    kicker: "Teams",
    title: "eSignatures for Real Estate",
    lead: "Close deals digitally with mobile-friendly signing links clients love.",
    sections: [
      {
        title: "Listings that don’t stall",
        body: "Get offers and disclosures signed from any phone or laptop.",
      },
      {
        title: "Fewer print trips",
        body: "Skip scanning and courier runs for routine paperwork.",
      },
      {
        title: "Track every party",
        body: "Buyers, sellers, and agents stay visible in one request timeline.",
      },
    ],
  },
  {
    slug: "ops",
    kicker: "Teams",
    title: "eSignatures for Operations",
    lead: "Fax and eSign from one workspace so field teams stay unblocked.",
    sections: [
      {
        title: "One source of truth",
        body: "Signature requests and online faxes live together for ops handoffs.",
      },
      {
        title: "Field-ready links",
        body: "Crews and partners can finish documents without a desktop setup.",
      },
      {
        title: "Less chasing",
        body: "Status and reminders cut the daily “did you sign yet?” noise.",
      },
    ],
  },
];

export function getFeaturePage(slug: string) {
  return FEATURE_PAGES.find((p) => p.slug === slug);
}

export function getTeamPage(slug: string) {
  return TEAM_PAGES.find((p) => p.slug === slug);
}
