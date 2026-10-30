import Stripe from "stripe";
import type { BillingInterval, PlanId } from "./types";

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

export function getPriceId(plan: PlanId, interval: BillingInterval) {
  if (plan === "free") return null;
  return priceEnv[plan][interval] || null;
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
