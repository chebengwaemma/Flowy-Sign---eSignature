import { NextResponse } from "next/server";
import { applyPaidPlan } from "@/lib/billing";
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
        await applyPaidPlan(user.id, user.orgId, plan, interval, customer);
      }
    }
  }

  return NextResponse.json({ received: true });
}
