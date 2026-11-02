import type { BillingInterval, PackageType, PlanId, User } from "./types";

/** Map existing PlanId → package rules (checkout API plan ids unchanged). */
export function packageFromPlan(plan: PlanId): {
  packageType: PackageType;
  maxConcurrentSessions: number | null;
} {
  if (plan === "business") {
    return { packageType: "unlimited_muscle", maxConcurrentSessions: null };
  }
  if (plan === "starter" || plan === "pro") {
    return { packageType: "personal", maxConcurrentSessions: 5 };
  }
  return { packageType: "none", maxConcurrentSessions: 1 };
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
  plan: PlanId,
  interval: BillingInterval | null,
): void {
  const { packageType, maxConcurrentSessions } = packageFromPlan(plan);
  const now = new Date().toISOString();
  user.packageType = packageType;
  user.maxConcurrentSessions = maxConcurrentSessions;
  user.subscriptionStatus = plan === "free" ? "inactive" : "active";
  user.packageActivatedAt = plan === "free" ? undefined : now;
  user.packageExpiresAt = packageExpiresAt(packageType, interval);
}

export function effectiveMaxSessions(user: User): number | null {
  if (typeof user.maxConcurrentSessions === "number" || user.maxConcurrentSessions === null) {
    return user.maxConcurrentSessions;
  }
  return packageFromPlan(user.plan || "free").maxConcurrentSessions;
}
