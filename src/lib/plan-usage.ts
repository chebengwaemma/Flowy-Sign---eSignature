import { signatureSendLimit } from "./plan-limits";
import { getPlanFromSettings } from "./plans";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { PlanId, User } from "./types";

function monthStartIso(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/** Signature requests that count toward the monthly package limit. */
export function isBillableSignatureDoc(status: string) {
  return status === "sent" || status === "viewed" || status === "completed";
}

export type SignatureQuota = {
  planId: PlanId;
  planName: string;
  limit: number; // -1 = unlimited
  used: number;
  remaining: number; // -1 = unlimited
  allowed: boolean;
  requiresPurchase: boolean;
  message: string;
};

export async function getSignatureQuota(user: User): Promise<SignatureQuota> {
  const store = await readStore();
  const settings = mergeSettings(store.site);
  const plan = getPlanFromSettings(user.plan, settings);
  const limit = signatureSendLimit(user.plan, settings);
  const start = monthStartIso();
  const used = store.documents.filter(
    (d) =>
      d.orgId === user.orgId &&
      isBillableSignatureDoc(d.status) &&
      d.createdAt >= start,
  ).length;

  const isUnlimited = limit < 0;
  const requiresPurchase = limit === 0;
  const remaining = isUnlimited ? -1 : Math.max(0, limit - used);
  const allowed = isUnlimited || remaining > 0;

  let message = "";
  if (requiresPurchase) {
    message =
      "No active plan for signatures. Buy a package first — each plan includes a monthly signature limit.";
  } else if (!allowed) {
    message = `Your ${plan.name} plan allows ${limit} signature request${limit === 1 ? "" : "s"} this month. You’ve used all of them — upgrade to continue.`;
  } else if (isUnlimited) {
    message = `${plan.name}: unlimited signature requests.`;
  } else {
    message = `${plan.name}: ${used} of ${limit} signature requests used this month (${remaining} left).`;
  }

  return {
    planId: plan.id,
    planName: plan.name,
    limit,
    used,
    remaining,
    allowed,
    requiresPurchase,
    message,
  };
}

export function quotaBlockedResponse(quota: SignatureQuota) {
  return {
    error: quota.message,
    code: quota.requiresPurchase ? "PLAN_REQUIRED" : "SIGNATURE_LIMIT",
    upgradeUrl: "/billing",
    quota: {
      planId: quota.planId,
      planName: quota.planName,
      limit: quota.limit,
      used: quota.used,
      remaining: quota.remaining,
    },
  };
}
