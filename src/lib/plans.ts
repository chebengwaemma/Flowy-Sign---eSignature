import type {
  BillingInterval,
  OrgSettings,
  PlanCategory,
  PlanDefinition,
  PlanId,
} from "./types";

export type { PlanDefinition };

const UNLIMITED_FEATURES = [
  "Unlimited signature requests",
  "Unlimited signature downloads",
  "Unlimited faxes",
  "Unlimited seats",
  "Unlimited templates & audit trail",
];

export const PAID_PLAN_IDS = ["pro", "pro_5", "business", "business_5"] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    category: "free",
    maxDevices: 1,
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
    visible: false,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "pro",
    name: "Pro · 1 device",
    category: "pro",
    maxDevices: 1,
    monthly: 29,
    yearly: 278,
    docs: -1,
    downloads: -1,
    faxes: -1,
    seats: -1,
    features: [...UNLIMITED_FEATURES, "1 concurrent device"],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "pro_5",
    name: "Pro · 5 devices",
    category: "pro",
    maxDevices: 5,
    monthly: 49,
    yearly: 470,
    docs: -1,
    downloads: -1,
    faxes: -1,
    seats: -1,
    features: [...UNLIMITED_FEATURES, "Up to 5 concurrent devices"],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "business",
    name: "Business · 1 device",
    category: "business",
    maxDevices: 1,
    monthly: 59,
    yearly: 566,
    docs: -1,
    downloads: -1,
    faxes: -1,
    seats: -1,
    features: [...UNLIMITED_FEATURES, "1 concurrent device", "Priority support"],
    visible: true,
    stripePriceMonthly: "",
    stripePriceYearly: "",
  },
  {
    id: "business_5",
    name: "Business · 5 devices",
    category: "business",
    maxDevices: 5,
    monthly: 89,
    yearly: 854,
    docs: -1,
    downloads: -1,
    faxes: -1,
    seats: -1,
    features: [...UNLIMITED_FEATURES, "Up to 5 concurrent devices", "Priority support"],
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

/** Map legacy plan ids (starter / old pro / business) onto the new catalog. */
export function normalizePlanId(id: string | null | undefined): PlanId {
  switch (id) {
    case "pro":
    case "pro_5":
    case "business":
    case "business_5":
    case "free":
      return id;
    case "starter":
      return "pro_5";
    default:
      return "free";
  }
}

export function isPaidPlanId(id: string): id is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(id);
}

export function planCategoryLabel(category: PlanCategory): string {
  if (category === "pro") return "Pro";
  if (category === "business") return "Business";
  return "Free";
}

export function mergePlans(partial?: Partial<PlanDefinition>[] | null): PlanDefinition[] {
  const byId = new Map(
    (partial || [])
      .filter((p) => p?.id)
      .map((p) => {
        const id = normalizePlanId(String(p!.id));
        return [id, { ...p, id }] as const;
      }),
  );
  // Prefer latest overlay when multiple legacy rows collapse onto one id
  return DEFAULT_PLANS.map((base) => {
    const over = byId.get(base.id);
    if (!over) return withSyncedPlanFeatures({ ...base, features: [...base.features] });
    return withSyncedPlanFeatures({
      ...base,
      id: base.id,
      category: base.category,
      name: typeof over.name === "string" && over.name.trim() ? over.name : base.name,
      maxDevices: numOr(over.maxDevices, base.maxDevices),
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
  const pro = plans.find((p) => p.id === "pro") ?? DEFAULT_PLANS[1];
  const business = plans.find((p) => p.id === "business") ?? DEFAULT_PLANS[3];
  return {
    sendFreeLimit: free.docs,
    generatorFreeDownloads: Math.max(0, free.downloads === -1 ? 999999 : free.downloads),
    starterSignatureLimit: pro.docs,
    proSignatureLimit: pro.docs,
    businessSignatureLimit: business.docs,
    starterFaxLimit: pro.faxes,
    proFaxLimit: pro.faxes,
    businessFaxLimit: business.faxes,
  };
}

export function getPlans(settings?: OrgSettings | null): PlanDefinition[] {
  if (!settings?.plans?.length) return mergePlans(null);
  return mergePlans(settings.plans);
}

export function getPaidPlans(settings?: OrgSettings | null): PlanDefinition[] {
  return getPlans(settings).filter((p) => p.id !== "free" && p.visible);
}

export function getPlansByCategory(
  category: "pro" | "business",
  settings?: OrgSettings | null,
): PlanDefinition[] {
  return getPaidPlans(settings).filter((p) => p.category === category);
}

export function getPlanFromSettings(id: PlanId | string, settings?: OrgSettings | null): PlanDefinition {
  const nid = normalizePlanId(id);
  return getPlans(settings).find((p) => p.id === nid) ?? DEFAULT_PLANS[0];
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
  return /signature request|signature download|generator download|\bfaxes?\b|\bseats?\b|team seats|concurrent device/i.test(
    line,
  );
}

/** Build the quota bullets that should always match docs/downloads/faxes/seats/devices */
export function quotaFeatureLines(plan: PlanDefinition): string[] {
  if (plan.id === "free") {
    return [
      qtyLabel(plan.downloads, "signature generator download / month", "signature generator downloads / month"),
      plan.docs <= 0
        ? "Buy a plan to send signature requests"
        : qtyLabel(plan.docs, "signature request / month", "signature requests / month"),
    ];
  }
  const devices =
    plan.maxDevices <= 1 ? "1 concurrent device" : `Up to ${plan.maxDevices} concurrent devices`;
  return [
    qtyLabel(plan.docs, "signature request / month", "signature requests / month"),
    qtyLabel(plan.downloads, "signature download / month", "signature downloads / month"),
    qtyLabel(plan.faxes, "fax", "faxes"),
    plan.seats === 1 ? "1 team seat" : qtyLabel(plan.seats, "team seat", "team seats"),
    devices,
  ];
}

/**
 * Features shown on /pricing and /billing.
 * Quota numbers always win; extra custom bullets are kept.
 */
export function planDisplayFeatures(plan: PlanDefinition): string[] {
  const extras = (plan.features || []).filter((f) => f.trim() && !isQuotaFeatureLine(f));
  return [...quotaFeatureLines(plan), ...extras];
}

/** Keep stored features array aligned when admin edits numeric quotas */
export function withSyncedPlanFeatures(plan: PlanDefinition): PlanDefinition {
  return { ...plan, features: planDisplayFeatures(plan) };
}
