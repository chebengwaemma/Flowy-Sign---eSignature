import Stripe from "stripe";
import { getPlanFromSettings, planStripePriceId } from "./plans";
import type { BillingInterval, OrgSettings, PlanId } from "./types";

/** Global billing currency — dashboard + Checkout always USD (no SGD/local FX). */
export const BILLING_CURRENCY = "usd" as const;

let stripeClient: Stripe | null | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (stripeClient === undefined) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

const priceEnv: Record<Exclude<PlanId, "free">, Record<BillingInterval, string | undefined>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
};

export function getPriceId(plan: PlanId, interval: BillingInterval, settings?: OrgSettings | null) {
  if (plan === "free") return null;
  const envId = priceEnv[plan][interval] || null;
  if (!settings) return envId;
  return planStripePriceId(getPlanFromSettings(plan, settings), interval, envId);
}

function productDisplayName(planName: string) {
  const n = (planName || "Plan").trim();
  return n.toLowerCase().startsWith("flowy") ? n : `Flowy Sign ${n}`;
}

/**
 * Resolve a Stripe Price whose unit_amount matches the live CMS plan amount.
 * Stale env/CMS price IDs (e.g. $15) are ignored when admin set monthly to $12.
 */
export async function resolveCheckoutPriceId(
  plan: Exclude<PlanId, "free">,
  interval: BillingInterval,
  settings: OrgSettings,
): Promise<{ priceId: string; amountCents: number; created: boolean } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const def = getPlanFromSettings(plan, settings);
  const dollars = interval === "monthly" ? def.monthly : def.yearly;
  if (typeof dollars !== "number" || !Number.isFinite(dollars) || dollars < 0) return null;
  const amountCents = Math.round(dollars * 100);
  const stripeInterval = interval === "yearly" ? "year" : "month";
  const preferredId = getPriceId(plan, interval, settings);

  if (preferredId) {
    try {
      const existing = await stripe.prices.retrieve(preferredId);
      if (
        existing.active &&
        existing.unit_amount === amountCents &&
        existing.currency === BILLING_CURRENCY &&
        existing.recurring?.interval === stripeInterval
      ) {
        return { priceId: existing.id, amountCents, created: false };
      }
    } catch {
      /* stale / wrong-mode price id — create matching one below */
    }
  }

  const productName = productDisplayName(def.name);
  let productId: string | null = null;

  try {
    const found = await stripe.products.search({
      query: `active:'true' AND name:'${productName.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    productId = found.data[0]?.id || null;
  } catch {
    productId = null;
  }

  if (!productId) {
    const created = await stripe.products.create({
      name: productName,
      metadata: { plan, currency: BILLING_CURRENCY },
    });
    productId = created.id;
  }

  const listed = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const match = listed.data.find(
    (p) =>
      p.unit_amount === amountCents &&
      p.currency === BILLING_CURRENCY &&
      p.recurring?.interval === stripeInterval,
  );
  if (match) {
    return { priceId: match.id, amountCents, created: false };
  }

  const created = await stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: BILLING_CURRENCY,
    recurring: { interval: stripeInterval },
    metadata: { plan, source: "cms-sync", currency: BILLING_CURRENCY },
  });
  return { priceId: created.id, amountCents, created: true };
}

/** Keep Mongo stripePrice* IDs aligned with CMS dollar amounts (best-effort). */
export async function syncPlanStripePriceIds(settings: OrgSettings): Promise<OrgSettings> {
  if (!stripeConfigured()) return settings;
  const plans = [...(settings.plans || [])];
  let changed = false;

  for (const plan of plans) {
    if (plan.id === "free") continue;
    for (const interval of ["monthly", "yearly"] as const) {
      try {
        const resolved = await resolveCheckoutPriceId(plan.id, interval, settings);
        if (!resolved) continue;
        if (interval === "monthly" && plan.stripePriceMonthly !== resolved.priceId) {
          plan.stripePriceMonthly = resolved.priceId;
          changed = true;
        }
        if (interval === "yearly" && plan.stripePriceYearly !== resolved.priceId) {
          plan.stripePriceYearly = resolved.priceId;
          changed = true;
        }
      } catch (err) {
        console.warn(
          `[stripe] sync price failed for ${plan.id}/${interval}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  if (!changed) return settings;
  return { ...settings, plans };
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeTestMode() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

export type StripePaymentsStatus = {
  configured: boolean;
  /** True when Checkout should run against Stripe (not local demo). */
  chargesEnabled: boolean;
  testMode: boolean;
  cardPayments: string | null;
  message: string;
};

/** Live check: account can take Checkout (test keys always allowed). */
export async function getStripePaymentsStatus(): Promise<StripePaymentsStatus> {
  if (!stripeConfigured()) {
    return {
      configured: false,
      chargesEnabled: false,
      testMode: false,
      cardPayments: null,
      message: "Stripe keys are not set — billing runs in demo mode.",
    };
  }
  const key = process.env.STRIPE_SECRET_KEY!;
  const testMode = isStripeTestMode();
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const account = (await res.json()) as {
      charges_enabled?: boolean;
      capabilities?: { card_payments?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        configured: true,
        chargesEnabled: false,
        testMode,
        cardPayments: null,
        message: account.error?.message || "Could not load Stripe account.",
      };
    }
    const cardPayments = account.capabilities?.card_payments || null;
    const liveReady = Boolean(account.charges_enabled) && cardPayments !== "inactive";
    // Test/sandbox keys can open Checkout even before full live activation
    if (testMode) {
      return {
        configured: true,
        chargesEnabled: true,
        testMode: true,
        cardPayments,
        message: "Stripe test mode is active — use card 4242 4242 4242 4242.",
      };
    }
    if (!liveReady) {
      return {
        configured: true,
        chargesEnabled: false,
        testMode: false,
        cardPayments,
        message:
          "Stripe live account cannot charge cards yet. Activate Cards in Dashboard → Settings → Payment methods, and finish account verification.",
      };
    }
    return {
      configured: true,
      chargesEnabled: true,
      testMode: false,
      cardPayments,
      message: "Stripe live payments are ready.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach Stripe";
    return {
      configured: true,
      chargesEnabled: false,
      testMode,
      cardPayments: null,
      message,
    };
  }
}
