import { signatureDownloadLimit } from "./plan-limits";
import { getPlanFromSettings } from "./plans";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { PlanId, User } from "./types";

function currentMonthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type GeneratorQuota = {
  planId: PlanId;
  planName: string;
  limit: number;
  used: number;
  remaining: number;
  allowed: boolean;
  message: string;
};

export async function getGeneratorQuota(user: User): Promise<GeneratorQuota> {
  const store = await readStore();
  const settings = mergeSettings(store.site);
  const plan = getPlanFromSettings(user.plan, settings);
  const limit = signatureDownloadLimit(user.plan, settings);
  const month = currentMonthKey();
  const used =
    user.generatorDownloadMonth === month ? user.generatorDownloadCount || 0 : 0;
  const unlimited = limit < 0;
  const remaining = unlimited ? -1 : Math.max(0, limit - used);
  const allowed = unlimited || remaining > 0;

  let message = "";
  if (user.plan === "free" && !allowed) {
    message = `Free includes ${Math.max(0, settings.generatorFreeDownloads)} signature download${settings.generatorFreeDownloads === 1 ? "" : "s"} this month. Buy a plan for more.`;
  } else if (!allowed) {
    message = `Your ${plan.name} plan allows ${limit} signature download${limit === 1 ? "" : "s"} this month. Limit reached — upgrade to continue.`;
  } else if (unlimited) {
    message = `${plan.name}: unlimited signature downloads.`;
  } else {
    message = `${plan.name}: ${used} of ${limit} signature downloads used this month (${remaining} left).`;
  }

  return {
    planId: plan.id,
    planName: plan.name,
    limit,
    used,
    remaining,
    allowed,
    message,
  };
}

export function monthKey() {
  return currentMonthKey();
}
