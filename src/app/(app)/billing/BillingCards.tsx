"use client";

import { PlanCatalog, type CatalogPlan } from "@/components/billing/PlanCatalog";
import type { BillingInterval, PlanId } from "@/lib/types";

export function BillingCards({
  currentPlan,
  currentInterval,
  plans,
}: {
  currentPlan: PlanId;
  currentInterval: BillingInterval | null;
  plans: CatalogPlan[];
}) {
  return (
    <PlanCatalog
      mode="billing"
      plans={plans}
      currentPlan={currentPlan}
      currentInterval={currentInterval}
    />
  );
}
