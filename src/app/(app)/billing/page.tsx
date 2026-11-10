import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/get-marketing";
import { getPaidPlans, getPlanFromSettings, getPlans } from "@/lib/plans";
import { purchasedInterval } from "@/lib/packages";
import { formatSigningDate } from "@/lib/signing-time";
import { getStripePaymentsStatus } from "@/lib/stripe";
import { BillingCards } from "./BillingCards";
import { BillingResult } from "./BillingResult";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    demo?: string;
    canceled?: string;
    stripePending?: string;
    plan?: string;
    interval?: string;
    session_id?: string;
    reason?: string;
    token?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const params = await searchParams;
  const [stripeStatus, site] = await Promise.all([getStripePaymentsStatus(), getSiteSettings()]);
  const plans = getPaidPlans(site);
  const current = getPlanFromSettings(user.plan, site);
  const interval = purchasedInterval(user);
  const maxDevices = current.maxDevices || user.maxConcurrentSessions || 1;
  const needsPayForDownload = params.reason === "download";
  const downloadToken = params.token || "";

  return (
    <div className="app-meet-page space-y-6">
      <ScrollMeetBlock side="left" distance={90}>
        <h1 className="display text-3xl sm:text-4xl">Billing</h1>
        <p className="mt-1 text-muted">
          Pro and Business — each with a 1-device or 5-device tier. All paid features are unlimited. Prices in
          USD
          {stripeStatus.testMode
            ? " · test mode."
            : stripeStatus.chargesEnabled
              ? "."
              : stripeStatus.configured
                ? " · card charges pending."
                : " · demo mode."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Current plan:{" "}
          <strong className="text-ink">{user.plan === "free" ? "None" : current.name}</strong>
          {user.plan !== "free"
            ? ` · ${interval === "yearly" ? "Yearly" : "Monthly"} · ${user.activeDevicesCount ?? 0}/${maxDevices} devices active`
            : ""}
          {user.packageActivatedAt
            ? ` · activated ${formatSigningDate(new Date(user.packageActivatedAt))}`
            : ""}
        </p>
      </ScrollMeetBlock>

      {needsPayForDownload && (
        <div className="panel border-accent/30 bg-mist/80 px-5 py-4 text-sm" role="status">
          <p className="font-semibold text-accent-deep">Subscription required to download</p>
          <p className="mt-1 text-muted">
            Your document is ready. Choose a Pro or Business plan to unlock the download link from your email.
            {downloadToken
              ? " After payment, open the same email link again — download will start for paid accounts."
              : ""}
          </p>
        </div>
      )}

      {stripeStatus.testMode && (
        <ScrollMeetBlock side="right" distance={90}>
          <div className="panel border-accent/30 bg-mist/80 px-5 py-4 text-sm" role="status">
            <p className="font-semibold text-accent-deep">Stripe test mode</p>
            <p className="mt-1 text-muted">{stripeStatus.message}</p>
          </div>
        </ScrollMeetBlock>
      )}

      <ScrollMeetBlock side="left" distance={100}>
        <BillingResult
          success={params.success === "1"}
          canceled={params.canceled === "1"}
          demo={params.demo === "1"}
          stripePending={params.stripePending === "1"}
          plan={params.plan}
          interval={params.interval}
          sessionId={params.session_id}
          plans={getPlans(site)}
        />
      </ScrollMeetBlock>

      <BillingCards
        currentPlan={user.plan}
        currentInterval={interval}
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          maxDevices: p.maxDevices,
          monthly: p.monthly,
          yearly: p.yearly,
          features: p.features,
        }))}
      />
    </div>
  );
}
