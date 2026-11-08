import { NextResponse } from "next/server";
import { applyPaidPlan } from "@/lib/billing";
import { maybeSendPurchaseEmail } from "@/lib/purchase-email";
import { getStripe } from "@/lib/stripe";
import type { BillingInterval, PlanId } from "@/lib/types";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as PlanId | undefined;
    const interval = (session.metadata?.interval as BillingInterval | undefined) ?? "monthly";
    if (userId && plan) {
      const storeUser = (await import("@/lib/store")).readStore;
      const data = await storeUser();
      const user = data.users.find((u) => u.id === userId);
      if (user) {
        const customer = typeof session.customer === "string" ? session.customer : undefined;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : undefined;
        await applyPaidPlan(user.id, user.orgId, plan, interval, customer, subscriptionId);
        await maybeSendPurchaseEmail({
          userId: user.id,
          sessionId: session.id || event.id,
          plan,
          interval,
        });
      }
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const reason = invoice.billing_reason;
    if (reason === "subscription_cycle" || reason === "subscription_update") {
      const details = invoice.parent?.subscription_details;
      const subscriptionRef = details?.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id || "";
      const meta = details?.metadata || {};
      const userId = meta.userId;
      const plan = meta.plan as PlanId | undefined;
      const interval = (meta.interval as BillingInterval | undefined) ?? "monthly";
      if (subscriptionId && userId && plan) {
        const { readStore } = await import("@/lib/store");
        const data = await readStore();
        const user = data.users.find((u) => u.id === userId);
        if (user) {
          const customer = typeof invoice.customer === "string" ? invoice.customer : undefined;
          await applyPaidPlan(user.id, user.orgId, plan, interval, customer, subscriptionId);
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;
    const { updateStore } = await import("@/lib/store");
    await updateStore((store) => {
      const user = store.users.find(
        (u) => u.id === userId || u.stripeSubscriptionId === subscription.id,
      );
      if (!user) return;
      user.subscriptionStatus = "canceled";
    });
  }

  return NextResponse.json({ received: true });
}
