import { isPaidPlanId, normalizePlanId } from "./plans";
import type { User } from "./types";

/** True when the user has an active paid Pro/Business plan (not Free). */
export function isPaidSubscriber(user: Pick<User, "plan" | "packageExpiresAt" | "subscriptionStatus">) {
  const plan = normalizePlanId(user.plan);
  if (!isPaidPlanId(plan)) return false;
  if (user.subscriptionStatus === "canceled") return false;
  if (user.packageExpiresAt) {
    const exp = new Date(user.packageExpiresAt).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) return false;
  }
  return true;
}
