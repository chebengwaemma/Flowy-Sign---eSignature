import type { BillingInterval, OrgSettings, PlanDefinition, PlanId } from "./types";

export type { PlanDefinition };

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    docs: 0,
    downloads: 1,
    faxes: 0,
    seats: 1,
    features: [
      "1 signature generator download / month",
      "Buy a plan to send signature requests",
      "Browse templates",
      "Email support",
    ],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "starter",
    name: "Starter",
    monthly: 15,
    yearly: 144,
    docs: 50,
    downloads: 50,
    faxes: 20,
    seats: 3,
    features: [
      "50 signature requests / month",
      "50 signature downloads / month",
      "20 faxes",
      "3 team seats",
      "Audit trail",
    ],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 39,
    yearly: 372,
    docs: 250,
    downloads: 250,
    faxes: 100,
    seats: 10,
    features: [
      "250 signature requests / month",
      "250 signature downloads / month",
      "100 faxes",
      "10 seats",
      "Priority support",
      "Custom branding",
    ],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "business",
    name: "Business",
    monthly: 79,
    yearly: 756,
    docs: -1,
    downloads: -1,
    faxes: -1,
    seats: 50,
    features: [
      "Unlimited signature requests",
      "Unlimited signature downloads",
      "Unlimited faxes",
      "50 seats",
      "Admin controls",
      "SSO-ready",
    ],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
];

/** @deprecated prefer getPlans(settings) */
export const PLANS = DEFAULT_PLANS;

function numOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mergePlans(partial?: Partial<PlanDefinition>[] | null): PlanDefinition[] {
  const byId = new Map((partial || []).filter((p) => p?.id).map((p) => [p.id!, p]));
  return DEFAULT_PLANS.map((base) => {
    const over = byId.get(base.id);
    if (!over) return withSyncedPlanFeatures({ ...base, features: [...base.features] });
    return withSyncedPlanFeatures({
      ...base,
      id: base.id,
      name: typeof over.name === "string" && over.name.trim() ? over.name : base.name,
      monthly: numOr(over.monthly, base.monthly),
      yearly: numOr(over.yearly, base.yearly),
      docs: numOr(over.docs, base.docs),
      downloads: numOr(over.downloads, base.downloads),
      faxes: numOr(over.faxes, base.faxes),
      seats: numOr(over.seats, base.seats),
      features: Array.isArray(over.features) ? over.features.map(String) : [...base.features],
      stripePriceMonthly: String(over.stripePriceMonthly ?? base.stripePriceMonthly ?? ""),
      stripePriceYearly: String(over.stripePriceYearly ?? base.stripePriceYearly ?? ""),
      visible: over.visible ?? base.visible,
    });
  });
}

export function legacyLimitsFromPlans(plans: PlanDefinition[]) {
  const free = plans.find((p) => p.id === "free") ?? DEFAULT_PLANS[0];
  const starter = plans.find((p) => p.id === "starter") ?? DEFAULT_PLANS[1];
  const pro = plans.find((p) => p.id === "pro") ?? DEFAULT_PLANS[2];
  const business = plans.find((p) => p.id === "business") ?? DEFAULT_PLANS[3];
  return {
    sendFreeLimit: free.docs,
    generatorFreeDownloads: Math.max(0, free.downloads === -1 ? 999999 : free.downloads),
    starterSignatureLimit: starter.docs,
    proSignatureLimit: pro.docs,
    businessSignatureLimit: business.docs,
    starterFaxLimit: starter.faxes,
    proFaxLimit: pro.faxes,
    businessFaxLimit: business.faxes,
  };
}

export function getPlans(settings?: OrgSettings | null): PlanDefinition[] {
  if (!settings?.plans?.length) return mergePlans(null);
  return mergePlans(settings.plans);
}

export function getPlanFromSettings(id: PlanId, settings?: OrgSettings | null): PlanDefinition {
  return getPlans(settings).find((p) => p.id === id) ?? DEFAULT_PLANS[0];
}

/** @deprecated Prefer getPlanFromSettings(id, site) so admin CMS quotas apply */
export function getPlan(id: PlanId) {
  return getPlanFromSettings(id, null);
}

export function planStripePriceId(
  plan: PlanDefinition,
  interval: BillingInterval,
  envFallback: string | null | undefined,
) {
  const fromAdmin =
    interval === "monthly" ? plan.stripePriceMonthly?.trim() : plan.stripePriceYearly?.trim();
  return fromAdmin || envFallback || null;
}

function qtyLabel(n: number, singular: string, plural: string) {
  if (n < 0) return `Unlimited ${plural}`;
  if (n === 0) return `No ${plural}`;
  return `${n} ${n === 1 ? singular : plural}`;
}

/** True if a feature line is auto-generated from quota numbers */
export function isQuotaFeatureLine(line: string) {
  return /signature request|signature download|generator download|\bfaxes?\b|\bseats?\b|team seats/i.test(
    line,
  );
}

/** Build the quota bullets that should always match docs/downloads/faxes/seats */
export function quotaFeatureLines(plan: PlanDefinition): string[] {
  if (plan.id === "free") {
    return [
      qtyLabel(plan.downloads, "signature generator download / month", "signature generator downloads / month"),
      plan.docs <= 0
        ? "Buy a plan to send signature requests"
        : qtyLabel(plan.docs, "signature request / month", "signature requests / month"),
    ];
  }
  return [
    qtyLabel(plan.docs, "signature request / month", "signature requests / month"),
    qtyLabel(plan.downloads, "signature download / month", "signature downloads / month"),
    qtyLabel(plan.faxes, "fax", "faxes"),
    plan.seats === 1
      ? "1 team seat"
      : qtyLabel(plan.seats, "team seat", "team seats"),
  ];
}

/**
 * Features shown on /pricing and /billing.
 * Quota numbers always win; extra custom bullets (Audit trail, SSO…) are kept.
 */
export function planDisplayFeatures(plan: PlanDefinition): string[] {
  const extras = (plan.features || []).filter((f) => f.trim() && !isQuotaFeatureLine(f));
  return [...quotaFeatureLines(plan), ...extras];
}

/** Keep stored features array aligned when admin edits numeric quotas */
export function withSyncedPlanFeatures(plan: PlanDefinition): PlanDefinition {
  return { ...plan, features: planDisplayFeatures(plan) };
}
