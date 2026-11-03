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

/** Bump when paid catalog layout changes (drops Starter, device tiers, etc.) */
export const PLAN_CATALOG_VERSION = 5;

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    category: "free",
    maxDevices: 1,
    monthly: 0,
    yearly: 0,
    // No paid features until checkout — all usage quotas stay 0
    docs: 0,
    downloads: 0,
    faxes: 0,
    seats: 1,
    features: [
      "No signature requests until you buy a plan",
      "No signature downloads until you buy a plan",
      "No faxes until you buy a plan",
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
    features: [...UNLIMITED_FEATURES],
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
    features: [...UNLIMITED_FEATURES],
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
    features: [...UNLIMITED_FEATURES, "Priority support"],
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
    features: [...UNLIMITED_FEATURES, "Priority support"],
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

/** Old CMS had free/starter/pro/business — never overlay "starter" onto pro_5. */
export function isLegacyPlanCatalog(
  partial?: Partial<PlanDefinition>[] | null,
  version?: number | null,
): boolean {
  if (typeof version === "number" && version >= PLAN_CATALOG_VERSION) return false;
  const rows = (partial || []).filter((p) => p?.id);
  if (!rows.length) return true;
  const ids = new Set(rows.map((p) => String(p!.id)));
  if (ids.has("starter")) return true;
  if (!ids.has("pro_5") || !ids.has("business_5")) return true;
  if (rows.some((p) => /starter/i.test(String(p!.name || "")))) return true;
  // version missing/outdated → re-run migration (fixes Starter $ stuck on pro_5)
  if (typeof version !== "number" || version < PLAN_CATALOG_VERSION) return true;
  return false;
}

function mergeLegacyPlans(partial: Partial<PlanDefinition>[]): PlanDefinition[] {
  const byExact = new Map(
    partial.filter((p) => p?.id && String(p.id) !== "starter").map((p) => [String(p!.id), p!] as const),
  );
  return DEFAULT_PLANS.map((base) => {
    const over = byExact.get(base.id);
    if (!over) {
      return withSyncedPlanFeatures({ ...base, features: [...base.features] });
    }
    if (base.id === "free") {
      return withSyncedPlanFeatures({
        ...base,
        name: typeof over.name === "string" && over.name.trim() ? over.name : base.name,
        monthly: 0,
        yearly: 0,
        docs: 0,
        downloads: 0,
        faxes: 0,
        seats: 1,
        maxDevices: 1,
        features: [...base.features],
        stripePriceMonthly: "",
        stripePriceYearly: "",
        visible: false,
      });
    }
    // Only keep prices from classic pro/business rows — never inherit Starter $ onto pro_5
    const keepPrice = base.id === "pro" || base.id === "business";
    return withSyncedPlanFeatures({
      ...base,
      id: base.id,
      category: base.category,
      name: base.name,
      maxDevices: base.maxDevices,
      monthly: keepPrice ? numOr(over.monthly, base.monthly) : base.monthly,
      yearly: keepPrice ? numOr(over.yearly, base.yearly) : base.yearly,
      docs: -1,
      downloads: -1,
      faxes: -1,
      seats: -1,
      features: [...base.features],
      stripePriceMonthly: keepPrice
        ? String(over.stripePriceMonthly ?? base.stripePriceMonthly ?? "")
        : String(base.stripePriceMonthly ?? ""),
      stripePriceYearly: keepPrice
        ? String(over.stripePriceYearly ?? base.stripePriceYearly ?? "")
        : String(base.stripePriceYearly ?? ""),
      visible: true,
    });
  });
}

export function mergePlans(
  partial?: Partial<PlanDefinition>[] | null,
  version?: number | null,
): PlanDefinition[] {
  const rows = (partial || []).filter((p) => p?.id);
  if (isLegacyPlanCatalog(rows, version)) {
    return mergeLegacyPlans(rows);
  }

  const byId = new Map(
    rows.map((p) => {
      const id = normalizePlanId(String(p!.id));
      return [id, { ...p, id }] as const;
    }),
  );
  return DEFAULT_PLANS.map((base) => {
    const over = byId.get(base.id);
    if (!over) return withSyncedPlanFeatures({ ...base, features: [...base.features] });
    const paid = base.id !== "free";
    if (!paid) {
      return withSyncedPlanFeatures({
        ...base,
        name: typeof over.name === "string" && over.name.trim() ? over.name : base.name,
        monthly: 0,
        yearly: 0,
        docs: 0,
        downloads: 0,
        faxes: 0,
        seats: 1,
        maxDevices: 1,
        features: [...base.features],
        visible: false,
        stripePriceMonthly: "",
        stripePriceYearly: "",
      });
    }
    return withSyncedPlanFeatures({
      ...base,
      id: base.id,
      category: base.category,
      name: typeof over.name === "string" && over.name.trim() ? over.name : base.name,
      maxDevices: numOr(over.maxDevices, base.maxDevices),
      monthly: numOr(over.monthly, base.monthly),
      yearly: numOr(over.yearly, base.yearly),
      // Paid catalog is always unlimited quotas (device tier is the only cap)
      docs: -1,
      downloads: -1,
      faxes: -1,
      seats: -1,
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
  if (!settings?.plans?.length) return mergePlans(null, settings?.planCatalogVersion);
  return mergePlans(settings.plans, settings.planCatalogVersion);
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

/** True if a feature line is auto-generated from quota / standard paid copy */
export function isQuotaFeatureLine(line: string) {
  return /signature request|signature download|generator download|\bfaxes?\b|\bseats?\b|team seats|concurrent device|templates?\s*&\s*audit|audit trail|buy a plan|invite teammates/i.test(
    line,
  );
}

/** Build the quota bullets that should always match docs/downloads/faxes/seats */
export function quotaFeatureLines(plan: PlanDefinition): string[] {
  if (plan.id === "free") {
    return [
      "No signature requests (buy a plan)",
      "No signature downloads (buy a plan)",
      "No faxes (buy a plan)",
      "1 seat — invite teammates after upgrade",
    ];
  }
  // Device tier is shown on the card header — keep the list to unlimited features only
  return [
    "Unlimited signature requests",
    "Unlimited signature downloads",
    "Unlimited faxes",
    "Unlimited team seats",
    "Unlimited templates & audit trail",
  ];
}

function dedupeFeatures(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

/**
 * Features shown on /pricing and /billing.
 * Quota lines win; only unique non-quota extras (e.g. Priority support) are kept.
 */
export function planDisplayFeatures(plan: PlanDefinition): string[] {
  const quota = quotaFeatureLines(plan);
  const quotaKeys = new Set(quota.map((l) => l.toLowerCase()));
  const extras = (plan.features || [])
    .map((f) => f.trim())
    .filter((f) => f && !isQuotaFeatureLine(f) && !quotaKeys.has(f.toLowerCase()));
  // Priority support for Business — keep once if present or category implies it
  const wantsPriority =
    plan.category === "business" ||
    extras.some((f) => /priority support/i.test(f)) ||
    (plan.features || []).some((f) => /priority support/i.test(f));
  const cleanedExtras = extras.filter((f) => !/priority support/i.test(f));
  if (wantsPriority && plan.id !== "free") cleanedExtras.push("Priority support");
  return dedupeFeatures([...quota, ...cleanedExtras]);
}

/** Keep stored features array aligned when admin edits numeric quotas */
export function withSyncedPlanFeatures(plan: PlanDefinition): PlanDefinition {
  return { ...plan, features: planDisplayFeatures(plan) };
}
