import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getGeneratorQuota } from "@/lib/generator-usage";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";
import { SignatureStudio } from "@/components/signature/SignatureStudio";
import { redirect } from "next/navigation";

export default async function AppSignatureGeneratorPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await readStore();
  const settings = mergeSettings(store.site);
  if (!settings.signatureGeneratorEnabled) {
    return (
      <div className="panel max-w-lg p-8 rise">
        <h1 className="display text-3xl">Signature generator</h1>
        <p className="mt-3 text-muted">This module is turned off by the administrator.</p>
        <Link href="/dashboard" className="btn btn-ghost mt-4 inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  const quota = await getGeneratorQuota(user);

  return (
    <div className="space-y-6 rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-4xl">{settings.navSignatureGenerator}</h1>
          <p className="mt-2 text-muted">
            Type your name into live handwriting fonts, or draw on the pad. Downloads follow your plan
            limit.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm">
          <p className="font-semibold text-ink">{quota.planName}</p>
          <p className="text-muted">
            {quota.limit < 0
              ? "Unlimited downloads"
              : `${quota.remaining} of ${quota.limit} downloads left this month`}
          </p>
          {!quota.allowed && (
            <Link href="/billing" className="mt-2 inline-block font-semibold text-accent-deep underline">
              Buy / upgrade plan
            </Link>
          )}
        </div>
      </div>

      {!quota.allowed && (
        <div className="rounded-2xl border border-[#f0d9c8] bg-[#fff8f3] px-5 py-4">
          <p className="font-semibold text-ink">Download limit reached</p>
          <p className="mt-1 text-sm text-muted">{quota.message}</p>
          <Link href="/billing" className="btn btn-primary mt-3 inline-flex">
            View packages & buy
          </Link>
        </div>
      )}

      <SignatureStudio requireQuota initialQuota={quota} billingHref="/billing" />
    </div>
  );
}
