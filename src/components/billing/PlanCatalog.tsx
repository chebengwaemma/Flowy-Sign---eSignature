"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import type { BillingInterval, PlanCategory, PlanId } from "@/lib/types";

export type CatalogPlan = {
  id: PlanId;
  name: string;
  category: PlanCategory;
  maxDevices: number;
  monthly: number;
  yearly: number;
  features: string[];
};

function shortName(plan: CatalogPlan) {
  if (plan.id === "business_5") return "Business";
  if (plan.category === "pro") return "Pro";
  if (plan.category === "business") return "Business";
  return plan.name;
}

export function PlanCatalog({
  plans,
  mode = "marketing",
  currentPlan,
  currentInterval,
  ctaLabel = "Get started",
  compareCta,
}: {
  plans: CatalogPlan[];
  mode?: "marketing" | "billing";
  currentPlan?: PlanId;
  currentInterval?: BillingInterval | null;
  ctaLabel?: string;
  compareCta?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const offers = useMemo(() => {
    const pro = plans.find((p) => p.id === "pro");
    const business = plans.find((p) => p.id === "business_5");
    const rows: Array<{
      plan: CatalogPlan;
      interval: BillingInterval;
      devices: string;
    }> = [];
    if (pro) {
      rows.push({ plan: pro, interval: "yearly", devices: "1 Device" });
      rows.push({ plan: pro, interval: "monthly", devices: "1 Device" });
    }
    if (business) {
      rows.push({ plan: business, interval: "yearly", devices: "5 Devices or emails" });
      rows.push({ plan: business, interval: "monthly", devices: "5 Devices or emails" });
    }
    return rows;
  }, [plans]);

  async function checkout(plan: PlanId, interval: BillingInterval) {
    if (mode !== "billing" || plan === "free") return;
    setLoading(plan + interval);
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok || data?.result === "unsuccess" || !data?.url) {
      setError(data?.error || "Payment unsuccessful — checkout could not start.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="pkg-catalog app-meet-page">
      {error && (
        <ScrollMeetBlock side="right" distance={90}>
          <div
            className="pkg-alert"
            data-billing-result="unsuccess"
            role="alert"
          >
            <p className="pkg-alert-title">Payment unsuccessful</p>
            <p className="pkg-alert-body">{error}</p>
            <button type="button" className="btn btn-primary" onClick={() => setError("")}>
              Try again
            </button>
          </div>
        </ScrollMeetBlock>
      )}

      <ScrollMeetSplit className="pkg-grid app-meet-grid" itemClassName="app-meet-item" distance={100} stagger={0.08}>
        {offers.map((offer) => {
          const price = offer.interval === "monthly" ? offer.plan.monthly : offer.plan.yearly;
          const per =
            offer.interval === "yearly" && offer.plan.yearly > 0 ? offer.plan.yearly / 12 : null;
          const active =
            mode === "billing" && currentPlan === offer.plan.id && currentInterval === offer.interval;
          const loadingKey = offer.plan.id + offer.interval;
          const title =
            offer.plan.id === "business_5" ? "Business" : shortName(offer.plan);
          return (
            <article
              key={loadingKey}
              className={["pkg-card", offer.plan.id === "business_5" ? "pkg-card-business" : "", active ? "is-current" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="pkg-card-top">
                <div className="pkg-card-badges">
                  <span className="pkg-chip">{title}</span>
                  <span className="pkg-chip pkg-chip-device">{offer.devices}</span>
                </div>
                <h3 className="pkg-card-name">
                  {title} · {offer.devices}
                </h3>
                <p className="pkg-period">{offer.interval === "yearly" ? "Yearly" : "Monthly"}</p>
              </div>
              <div className="pkg-card-price">
                <span className="pkg-price-amount">${price}</span>
                <span className="pkg-price-unit">{offer.interval === "yearly" ? "/year" : "/month"}</span>
                {per != null ? <span className="pkg-price-note">${per} × 12</span> : null}
              </div>
              {mode === "billing" ? (
                <button
                  type="button"
                  className={`pkg-cta${active ? " is-ghost" : ""}`}
                  disabled={active || loading === loadingKey}
                  onClick={() => checkout(offer.plan.id, offer.interval)}
                >
                  {active ? "Current plan" : loading === loadingKey ? "Redirecting…" : "Choose plan"}
                </button>
              ) : (
                <Link href="/signup" className="pkg-cta">
                  {compareCta || ctaLabel}
                </Link>
              )}
            </article>
          );
        })}
      </ScrollMeetSplit>
    </div>
  );
}
