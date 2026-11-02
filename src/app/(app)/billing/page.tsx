import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/get-marketing";
import { getPlans, planDisplayFeatures } from "@/lib/plans";
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
  }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const params = await searchParams;
  const [stripeStatus, site] = await Promise.all([getStripePaymentsStatus(), getSiteSettings()]);
  const plans = getPlans(site).filter((p) => p.visible && p.id !== "free");

  return (
    <div className="app-meet-page space-y-6">
      <ScrollMeetBlock side="left" distance={90}>
        <h1 className="display text-4xl">Billing</h1>
        <p className="mt-1 text-muted">
          Personal Package = up to 5 devices · Unlimited Muscle = no device caps. Prices in USD; Stripe
          may show local currency at checkout
          {stripeStatus.testMode
            ? " · test mode."
            : stripeStatus.chargesEnabled
              ? "."
              : stripeStatus.configured
                ? " · card charges pending."
                : " · demo mode."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Current package:{" "}
          <strong className="text-ink">
            {user.packageType === "unlimited_muscle"
              ? "Unlimited Muscle"
              : user.packageType === "personal"
                ? "Personal"
                : "None"}
          </strong>
          {user.packageType === "personal"
            ? ` · ${user.activeDevicesCount ?? 0}/5 devices active`
            : user.packageType === "unlimited_muscle"
              ? " · unlimited devices"
              : ""}
          {user.packageActivatedAt
            ? ` · activated ${new Date(user.packageActivatedAt).toLocaleDateString()}`
            : ""}
        </p>
      </ScrollMeetBlock>

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
        currentInterval={user.billingInterval}
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          monthly: p.monthly,
          yearly: p.yearly,
          features: planDisplayFeatures(p),
        }))}
      />
    </div>
  );
}
