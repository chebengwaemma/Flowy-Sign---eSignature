import Link from "next/link";

const samples = [
  { title: "Mutual NDA", type: "Legal" },
  { title: "Offer letter", type: "HR" },
  { title: "Vendor agreement", type: "Sales" },
  { title: "Service SOW", type: "Ops" },
];

export default function TemplatesPage() {
  return (
    <div className="home-page rise space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1e1919]">Templates</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pre-made layouts you can customise and reuse.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {samples.map((t) => (
          <Link
            key={t.title}
            href="/documents/new"
            className="rounded-xl border border-[var(--line)] bg-white p-5 transition hover:border-[#1e1919]/20 hover:shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t.type}
            </p>
            <p className="mt-2 font-semibold text-[#1e1919]">{t.title}</p>
            <p className="mt-4 text-sm font-medium text-[#1fa97a]">Use template →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
