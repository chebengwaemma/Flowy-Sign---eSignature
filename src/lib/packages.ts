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
    const free = getPlanFromSettings(id, settings);
    return { packageType: "none", maxConcurrentSessions: Math.max(1, free.maxDevices || 1) };
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

/** How many signer emails this account may use. One device stays on the account email. */
export function signerEmailLimit(user: User, settings?: OrgSettings | null): number {
  const planMax = getPlanFromSettings(user.plan, settings).maxDevices || 0;
  const sessionMax = typeof user.maxConcurrentSessions === "number" ? user.maxConcurrentSessions : 0;
  return Math.max(1, planMax, sessionMax);
}

export type DeviceSignerSlot = { name: string; email: string };

export function cleanDeviceSigners(raw: unknown): DeviceSignerSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: DeviceSignerSlot[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const name = String((item as { name?: unknown }).name || "").trim();
    const email = String((item as { email?: unknown }).email || "")
      .trim()
      .toLowerCase();
    if (!name || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push({ name, email });
  }
  return out;
}

/** 1 device is always locked to the account email. More devices lock once every slot is saved. */
export function deviceSignersLocked(user: User, settings?: OrgSettings | null): boolean {
  const limit = signerEmailLimit(user, settings);
  if (limit <= 1) return true;
  return cleanDeviceSigners(user.deviceSigners).length >= limit;
}

export function lockDeviceSigners(
  user: User,
  incoming: { name: string; email: string }[],
  settings?: OrgSettings | null,
): { ok: true; signers: DeviceSignerSlot[] } | { ok: false; error: string } {
  const limit = signerEmailLimit(user, settings);
  if (limit <= 1) {
    return { ok: false, error: "This plan uses only the account email." };
  }
  if (cleanDeviceSigners(user.deviceSigners).length >= limit) {
    return { ok: false, error: "These device emails are locked and cannot be changed." };
  }
  if (incoming.length !== limit) {
    return { ok: false, error: `Enter all ${limit} device emails before they can lock.` };
  }
  const signers = cleanDeviceSigners(incoming);
  if (signers.length !== limit) {
    return { ok: false, error: "Each slot needs a name and a different email." };
  }
  return { ok: true, signers };
}

/** Reject any recipient outside the account email (1 device) or the locked roster (5 devices). */
export function assertSignerRecipients(
  user: User,
  recipients: { email: string }[],
  settings?: OrgSettings | null,
): { ok: true; emails: string[] } | { ok: false; error: string } {
  const limit = signerEmailLimit(user, settings);
  const emails = recipients.map((r) => r.email.trim().toLowerCase());
  if (emails.length > limit) {
    return {
      ok: false,
      error: `This plan allows ${limit} signer email${limit === 1 ? "" : "s"}.`,
    };
  }
  if (new Set(emails).size !== emails.length) {
    return { ok: false, error: "Each signer email must be different." };
  }
  if (limit <= 1) {
    const account = user.email.trim().toLowerCase();
    if (emails.length !== 1 || emails[0] !== account) {
      return { ok: false, error: "This plan can only use the account email." };
    }
    return { ok: true, emails: [account] };
  }
  const roster = cleanDeviceSigners(user.deviceSigners).slice(0, limit);
  if (roster.length < limit) {
    const account = user.email.trim().toLowerCase();
    if (emails.length === 1 && emails[0] === account) return { ok: true, emails: [account] };
    return { ok: false, error: "Only Signer 1, the account email, can be used." };
  }
  const allowed = new Map(roster.map((slot) => [slot.email, slot.email]));
  const canonical: string[] = [];
  for (const email of emails) {
    const match = allowed.get(email);
    if (!match) {
      return {
        ok: false,
        error: "Only the locked device emails can be used. A new email cannot be added.",
      };
    }
    canonical.push(match);
  }
  return { ok: true, emails: canonical };
}

export function effectiveMaxSessions(user: User, settings?: OrgSettings | null): number | null {
  return packageFromPlan(user.plan || "free", settings).maxConcurrentSessions;
}
