import { getPlanFromSettings, normalizePlanId } from "./plans";
import type { BillingInterval, OrgSettings, PackageType, PlanId, User } from "./types";

/** Map PlanId → concurrent device rules (admin maxDevices is source of truth). */
export function packageFromPlan(
  plan: PlanId | string,
  settings?: OrgSettings | null,
): {
  packageType: PackageType;
  maxConcurrentSessions: number | null;
} {
  const id = normalizePlanId(plan);
  if (id === "free") {
    return { packageType: "none", maxConcurrentSessions: 1 };
  }
  const def = getPlanFromSettings(id, settings);
  const max = Math.max(1, def.maxDevices || 1);
  return {
    packageType: "personal",
    maxConcurrentSessions: max,
  };
}

export function packageExpiresAt(
  packageType: PackageType,
  interval: BillingInterval | null,
  from = new Date(),
): string | null {
  if (packageType === "unlimited_muscle") return null;
  if (packageType !== "personal" || !interval) return null;
  const d = new Date(from);
  if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function applyPackageFields(
  user: User,
  plan: PlanId | string,
  interval: BillingInterval | null,
  settings?: OrgSettings | null,
): void {
  const id = normalizePlanId(plan);
  const { packageType, maxConcurrentSessions } = packageFromPlan(id, settings);
  const now = new Date().toISOString();
  user.plan = id;
  user.packageType = packageType;
  user.maxConcurrentSessions = maxConcurrentSessions;
  user.subscriptionStatus = id === "free" ? "inactive" : "active";
  user.packageActivatedAt = id === "free" ? undefined : now;
  user.packageExpiresAt = packageExpiresAt(packageType, interval);
}

/**
 * The billing column this account actually purchased.
 * A paid plan with no saved period is treated as monthly — admin plan
 * changes and older accounts stored the plan id only.
 */
export function purchasedInterval(
  user: Pick<User, "plan" | "billingInterval" | "packageActivatedAt" | "packageExpiresAt">,
): BillingInterval | null {
  if (!user.plan || user.plan === "free") return null;
  if (user.billingInterval === "monthly" || user.billingInterval === "yearly") {
    return user.billingInterval;
  }
  if (user.packageActivatedAt && user.packageExpiresAt) {
    const days =
      (Date.parse(user.packageExpiresAt) - Date.parse(user.packageActivatedAt)) / 86_400_000;
    if (Number.isFinite(days) && days >= 300) return "yearly";
    if (Number.isFinite(days) && days >= 20) return "monthly";
  }
  return "monthly";
}

/** How many signer emails this account may enter. The first slot is always the account email. */
export function signerEmailLimit(user: User, settings?: OrgSettings | null): number {
  const planMax = getPlanFromSettings(user.plan, settings).maxDevices || 0;
  const sessionMax = typeof user.maxConcurrentSessions === "number" ? user.maxConcurrentSessions : 0;
  return Math.max(1, planMax, sessionMax);
}

export function effectiveMaxSessions(user: User, settings?: OrgSettings | null): number | null {
  if (typeof user.maxConcurrentSessions === "number" || user.maxConcurrentSessions === null) {
    return user.maxConcurrentSessions;
  }
  return packageFromPlan(user.plan || "free", settings).maxConcurrentSessions;
}
