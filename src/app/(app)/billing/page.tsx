import { getSessionUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
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
  const stripeStatus = await getStripePaymentsStatus();

  return (
    <div className="space-y-6 rise">
      <div>
        <h1 className="display text-4xl">Billing</h1>
        <p className="mt-1 text-muted">
          Stripe subscriptions for monthly and yearly tiers
          {stripeStatus.testMode
            ? " (test mode)."
            : stripeStatus.chargesEnabled
              ? "."
              : stripeStatus.configured
                ? " (card charges pending — demo fallback if needed)."
                : " (demo mode — add Stripe keys to go live)."}
        </p>
      </div>

      {stripeStatus.testMode && (
        <div className="panel border-accent/30 bg-mist/80 px-5 py-4 text-sm" role="status">
          <p className="font-semibold text-accent-deep">Stripe test mode</p>
          <p className="mt-1 text-muted">{stripeStatus.message}</p>
        </div>
      )}

      <BillingResult
        success={params.success === "1"}
        canceled={params.canceled === "1"}
        demo={params.demo === "1"}
        stripePending={params.stripePending === "1"}
        plan={params.plan}
        interval={params.interval}
        sessionId={params.session_id}
      />

      <BillingCards
        currentPlan={user.plan}
        currentInterval={user.billingInterval}
        plans={PLANS.map((p) => ({
          id: p.id,
          name: p.name,
          monthly: p.monthly,
          yearly: p.yearly,
          features: [...p.features],
        }))}
      />
    </div>
  );
}
