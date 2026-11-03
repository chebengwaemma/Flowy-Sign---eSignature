import Link from "next/link";
import type { SignatureQuota } from "@/lib/plan-usage";

export function PlanGate({ quota }: { quota: SignatureQuota }) {
  return (
    <div className="mx-auto max-w-xl rise rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-deep">Plan required</p>
      <h1 className="display mt-2 text-3xl text-ink">
        {quota.requiresPurchase ? "Buy a plan to send signatures" : "Signature limit reached"}
      </h1>
      <p className="mt-3 text-muted">{quota.message}</p>
      <div className="mt-4 rounded-xl bg-[#f7f5f2] px-4 py-3 text-sm text-ink">
        <p>
          <strong>{quota.planName}</strong>
          {quota.limit < 0
            ? " · Unlimited signatures"
            : ` · ${quota.used}/${quota.limit} signature requests this month`}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/billing" className="btn btn-primary">
          View packages & buy
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
