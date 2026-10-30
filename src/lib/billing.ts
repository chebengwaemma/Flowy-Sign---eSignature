import { updateStore } from "./store";
import type { BillingInterval, PlanId } from "./types";

export function applyPaidPlan(userId: string, orgId: string, plan: PlanId, interval: BillingInterval, stripeCustomerId?: string) {
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    const org = store.organizations.find((o) => o.id === orgId);
    if (user) {
      user.plan = plan;
      user.billingInterval = interval;
      if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
    }
    if (org) org.plan = plan;
    for (const member of store.users.filter((m) => m.orgId === orgId)) {
      member.plan = plan;
      member.billingInterval = interval;
    }
  });
}
