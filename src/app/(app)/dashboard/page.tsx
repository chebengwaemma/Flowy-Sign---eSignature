import Link from "next/link";
import { X } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getSignatureQuota } from "@/lib/plan-usage";
import { mergeSettings } from "@/lib/settings";
import { getOrgDocuments, readStore } from "@/lib/store";
import { UploadDropzone } from "@/components/UploadDropzone";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const store = await readStore();
  const settings = mergeSettings(store.site);
  const docs = await getOrgDocuments(user.orgId);
  const quota = await getSignatureQuota(user);
  const pendingSignature = docs.filter((d) => d.status === "sent" || d.status === "viewed").length;
  const pendingYours = 0;
  const drafts = docs.filter((d) => d.status === "draft").length;
  const signed = docs.filter((d) => d.status === "completed").length;
  const firstName = (user.name || user.email || "there").split(" ")[0];

  const stats = [
    { label: "Pending signature", value: pendingSignature, tone: "amber" },
    { label: "Pending your signature", value: pendingYours, tone: "amber" },
    { label: "Draft", value: drafts, tone: "grey" },
    { label: "Signed", value: signed, tone: "green" },
  ];

  const quotaLabel =
    quota.limit < 0
      ? "Unlimited signatures"
      : quota.requiresPurchase
        ? "No plan — 0 signatures"
        : `${quota.remaining} of ${quota.limit} signatures left`;

  return (
    <div className="home-page rise">
      <div className="home-hello">
        <h1>
          Hello, {firstName}!{" "}
          <span className="home-hello-sub">{settings.homeGreetingSuffix}</span>
        </h1>
      </div>

      {!quota.allowed && (
        <div className="mb-5 rounded-2xl border border-[#f0d9c8] bg-[#fff8f3] px-5 py-4">
          <p className="font-semibold text-ink">
            {quota.requiresPurchase ? "Buy a plan to send signatures" : "Signature limit reached"}
          </p>
          <p className="mt-1 text-sm text-muted">{quota.message}</p>
          <Link href="/billing" className="btn btn-primary mt-3 inline-flex">
            View packages & buy
          </Link>
        </div>
      )}

      {quota.allowed && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-5 py-3 text-sm">
          <p className="text-ink">
            <span className="font-semibold">{quota.planName}</span>
            <span className="text-muted"> · {quotaLabel}</span>
          </p>
          {settings.billingEnabled && (
            <Link href="/billing" className="font-semibold text-accent-deep underline underline-offset-2">
              Manage plan
            </Link>
          )}
        </div>
      )}

      <div className="stat-row">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-item tone-${stat.tone}`}>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">
              <span className={`dot dot-${stat.tone}`} />
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <UploadDropzone />

      <div className="template-banner">
        <div className="template-banner-copy">
          <p className="font-semibold text-[#1e1919]">
            Sign faster with pre-made templates <span className="new-pill">New!</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Expertly designed templates. Customised by you.{" "}
            <Link
              href="/templates"
              className="font-semibold text-[#1e1919] underline underline-offset-2"
            >
              Browse all templates
            </Link>
          </p>
        </div>
        <div className="template-banner-art" aria-hidden>
          <div className="mini-doc">PDF</div>
          <div className="mini-sig">Sign</div>
        </div>
        <Link href="/templates" className="banner-close" aria-label="Browse templates">
          <X size={16} />
        </Link>
      </div>
    </div>
  );
}
