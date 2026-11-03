import Link from "next/link";

const samples = [
  {
    title: "Mutual NDA",
    type: "Legal",
    blurb: "Two-party confidentiality for deals and partnerships.",
  },
  {
    title: "Offer letter",
    type: "HR",
    blurb: "Role, start date, and compensation in one clean letter.",
  },
  {
    title: "Vendor agreement",
    type: "Sales",
    blurb: "Scope, payment terms, and signature blocks for vendors.",
  },
  {
    title: "Service SOW",
    type: "Ops",
    blurb: "Deliverables, timeline, and acceptance criteria.",
  },
];

const tabs = ["All", "Legal", "HR", "Sales", "Ops"] as const;

export default function TemplatesPage() {
  return (
    <div className="templates-page">
      <header className="templates-head">
        <div>
          <h1 className="display text-3xl text-ink">Templates</h1>
          <p className="mt-1 text-sm text-muted">
            Pre-made layouts you can customise and reuse for signature requests.
          </p>
        </div>
        <Link href="/documents/new" className="btn btn-primary">
          Start from blank
        </Link>
      </header>

      <div className="template-banner">
        <div>
          <p className="text-sm font-semibold text-ink">
            Pick a template <span className="new-pill">Ready</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Each template opens a new document you can edit, add signers to, and send.
          </p>
        </div>
        <div className="template-banner-art" aria-hidden>
          <div className="mini-doc">PDF</div>
          <div className="mini-sig">Sign</div>
        </div>
      </div>

      <div className="template-tabs" role="tablist" aria-label="Template categories">
        {tabs.map((tab, i) => (
          <span key={tab} className={`template-tab${i === 0 ? " active" : ""}`} role="tab">
            {tab}
          </span>
        ))}
      </div>

      <div className="templates-grid">
        {samples.map((t) => (
          <Link key={t.title} href="/documents/new" className="template-card">
            <div className="template-card-preview" aria-hidden>
              <span className="template-card-lines" />
              <span className="template-card-lines short" />
              <span className="template-card-lines" />
              <span className="template-card-sig">✎</span>
            </div>
            <p className="template-card-type">{t.type}</p>
            <h2 className="template-card-title">{t.title}</h2>
            <p className="template-card-blurb">{t.blurb}</p>
            <span className="template-card-cta">Use template</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
