import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { applyPaidPlan } from "@/lib/billing";
import { getSiteSettings } from "@/lib/get-marketing";
import { getPlanFromSettings } from "@/lib/plans";
import {
  getStripe,
  getStripePaymentsStatus,
  resolveCheckoutPriceId,
  stripeConfigured,
} from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { updateStore } from "@/lib/store";
import type { BillingInterval, PlanId } from "@/lib/types";

const schema = z.object({
  plan: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["monthly", "yearly"]),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", result: "unsuccess" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", result: "unsuccess" }, { status: 400 });
  }

  const body = schema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid plan selection", result: "unsuccess" }, { status: 400 });
  }

  const plan = body.data.plan as Exclude<PlanId, "free">;
  const interval = body.data.interval as BillingInterval;
  const appUrl = getAppUrl();
  const stripe = getStripe();
  const site = await getSiteSettings();
  const planDef = getPlanFromSettings(plan, site);
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
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe client unavailable", result: "unsuccess" },
        { status: 503 },
      );
    }

    let resolved: { priceId: string; amountCents: number; created: boolean } | null = null;
    try {
      resolved = await resolveCheckoutPriceId(plan, interval, site);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resolve Stripe price";
      return NextResponse.json({ error: message, result: "unsuccess" }, { status: 502 });
    }

    if (!resolved?.priceId) {
      return NextResponse.json(
        {
          error: "Could not create a Stripe price matching the current plan amount. Check Stripe keys.",
          result: "unsuccess",
        },
        { status: 503 },
      );
    }

    // Persist matching price ID so next checkout is instant and admin panel stays in sync
    if (resolved.created || resolved.priceId) {
      const field = interval === "monthly" ? "stripePriceMonthly" : "stripePriceYearly";
      await updateStore((store) => {
        const plans = store.site?.plans || [];
        store.site = {
          ...store.site,
          plans: plans.map((p) =>
            p.id === plan ? { ...p, [field]: resolved!.priceId } : p,
          ),
        };
      }).catch(() => undefined);
    }

    try {
      // Local currency by customer location (BD→BDT, IN→INR, PK→PKR, …) via Stripe Adaptive Pricing
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email || undefined,
        line_items: [{ price: resolved.priceId, quantity: 1 }],
        billing_address_collection: "auto",
        allow_promotion_codes: true,
        adaptive_pricing: { enabled: true },
        success_url: `${appUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${interval}`,
        cancel_url: `${appUrl}/billing?canceled=1&plan=${plan}&interval=${interval}`,
        metadata: {
          userId: user.id,
          plan,
          interval,
          amountCents: String(resolved.amountCents),
          planName: planDef.name || plan,
        },
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
      return NextResponse.json({
        url: session.url,
        mode: "stripe",
        result: "success",
        plan,
        interval,
        amount: resolved.amountCents / 100,
      });
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
