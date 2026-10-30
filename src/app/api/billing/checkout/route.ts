import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { applyPaidPlan } from "@/lib/billing";
import { getPriceId, getStripe, getStripePaymentsStatus, stripeConfigured } from "@/lib/stripe";
import type { BillingInterval, PlanId } from "@/lib/types";

const schema = z.object({
  plan: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", result: "unsuccess" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid plan selection", result: "unsuccess" }, { status: 400 });
  }

  const plan = body.data.plan as PlanId;
  const interval = body.data.interval as BillingInterval;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();
  const priceId = getPriceId(plan, interval);
  const status = await getStripePaymentsStatus();

  if (stripeConfigured() && !status.chargesEnabled) {
    await applyPaidPlan(user.id, user.orgId, plan, interval);
    return NextResponse.json({
      url: `${appUrl}/billing?success=1&demo=1&stripePending=1&plan=${plan}&interval=${interval}`,
      mode: "demo",
      result: "success",
      plan,
      interval,
      warning: status.message,
    });
  }

  if (stripeConfigured()) {
    if (!stripe || !priceId) {
      return NextResponse.json(
        {
          error: "Stripe is configured but this plan price ID is missing. Try again after restarting the server.",
          result: "unsuccess",
        },
        { status: 503 },
      );
    }
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        billing_address_collection: "auto",
        allow_promotion_codes: true,
        success_url: `${appUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${interval}`,
        cancel_url: `${appUrl}/billing?canceled=1&plan=${plan}&interval=${interval}`,
        metadata: { userId: user.id, plan, interval },
        subscription_data: {
          metadata: { userId: user.id, plan, interval },
        },
      });
      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe did not return a checkout URL", result: "unsuccess" },
          { status: 502 },
        );
      }
      return NextResponse.json({ url: session.url, mode: "stripe", result: "success", plan, interval });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe checkout failed";
      if (/payment method|payment_methods|charges_enabled|No such price/i.test(message)) {
        await applyPaidPlan(user.id, user.orgId, plan, interval);
        return NextResponse.json({
          url: `${appUrl}/billing?success=1&demo=1&stripePending=1&plan=${plan}&interval=${interval}`,
          mode: "demo",
          result: "success",
          plan,
          interval,
          warning: message,
        });
      }
      return NextResponse.json({ error: message, result: "unsuccess" }, { status: 502 });
    }
  }

  await applyPaidPlan(user.id, user.orgId, plan, interval);
  return NextResponse.json({
    url: `${appUrl}/billing?success=1&demo=1&plan=${plan}&interval=${interval}`,
    mode: "demo",
    result: "success",
    plan,
    interval,
  });
}
