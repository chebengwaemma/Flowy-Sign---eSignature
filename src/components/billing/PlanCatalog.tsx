"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { planCategoryLabel } from "@/lib/plans";
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
  if (plan.category === "pro") return "Pro";
  if (plan.category === "business") return "Business";
  return plan.name;
}

function yearlySavePct(monthly: number, yearly: number) {
  if (monthly <= 0 || yearly <= 0) return 0;
  const full = monthly * 12;
  if (full <= yearly) return 0;
  return Math.round(((full - yearly) / full) * 100);
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

  const groups = useMemo(() => {
    const order: Array<"pro" | "business"> = ["pro", "business"];
    return order
      .map((category) => ({
        category,
        label: planCategoryLabel(category),
        items: plans
          .filter((p) => p.category === category)
          .slice()
          .sort((a, b) => a.maxDevices - b.maxDevices),
      }))
      .filter((g) => g.items.length > 0);
  }, [plans]);

  async function checkout(plan: PlanId, interval: BillingInterval) {
    if (mode !== "billing" || plan === "free") return;
    const key = `${plan}:${interval}`;
    setLoading(key);
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

      {groups.map((group) => (
        <section key={group.category} className="pkg-group">
          <ScrollMeetBlock side={group.category === "pro" ? "left" : "right"} distance={90}>
            <header className="pkg-group-head">
              <p className="pkg-group-kicker">{group.label}</p>
              <h2 className="pkg-group-title">{group.label} packages</h2>
              <p className="pkg-group-lead">
                Everything unlimited after purchase — pick 1 device or up to 5.
              </p>
            </header>
          </ScrollMeetBlock>

          <ScrollMeetSplit
            className="pkg-grid app-meet-grid"
            itemClassName="app-meet-item"
            distance={120}
            stagger={0.1}
          >
            {group.items.map((plan) => {
              const featured = plan.maxDevices > 1;
              const save = yearlySavePct(plan.monthly, plan.yearly);
              const features = (() => {
                const seen = new Set<string>();
                return (plan.features || [])
                  .map((f) => f.trim())
                  .filter(Boolean)
                  .filter((f) => {
                    // Device line already shown under the title
                    if (/concurrent device/i.test(f)) return false;
                    const key = f.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
              })();

              return (
                <article
                  key={plan.id}
                  className={[
                    "pkg-card",
                    featured ? "pkg-card-featured" : "",
                    group.category === "business" ? "pkg-card-business" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="pkg-card-top">
                    <div className="pkg-card-badges">
                      <span className="pkg-chip">{shortName(plan)}</span>
                      <span className="pkg-chip pkg-chip-device">
                        {plan.maxDevices <= 1 ? "1 device" : `${plan.maxDevices} devices`}
                      </span>
                      {featured ? <span className="pkg-chip pkg-chip-hot">Best value</span> : null}
                    </div>
                    <h3 className="pkg-card-name">{plan.name}</h3>
                    <p className="pkg-card-device">
                      {plan.maxDevices <= 1
                        ? "Single user · 1 concurrent signed-in device"
                        : `Team ready · up to ${plan.maxDevices} concurrent devices`}
                    </p>
                  </div>

                  <div className="pkg-intervals">
                    {(["monthly", "yearly"] as const).map((item) => {
                      const price = item === "monthly" ? plan.monthly : plan.yearly;
                      const active =
                        mode === "billing" && currentPlan === plan.id && currentInterval === item;
                      const perMonth =
                        item === "yearly" && plan.yearly > 0
                          ? Math.round((plan.yearly / 12) * 100) / 100
                          : null;
                      const busy = loading === `${plan.id}:${item}`;
                      return (
                        <div key={item} className={`pkg-interval${active ? " is-current" : ""}`}>
                          <div className="pkg-interval-label">
                            <span>{item === "monthly" ? "Monthly" : "Yearly"}</span>
                            {active ? <span className="pkg-chip pkg-chip-active">Active</span> : null}
                          </div>
                          <div className="pkg-card-price">
                            <span className="pkg-price-amount">${price}</span>
                            <span className="pkg-price-unit">/{item === "monthly" ? "mo" : "yr"}</span>
                            {item === "yearly" && perMonth != null ? (
                              <span className="pkg-price-note">
                                ≈ ${perMonth}/mo
                                {save > 0 ? ` · save ${save}%` : ""}
                              </span>
                            ) : (
                              <span className="pkg-price-note">Billed monthly</span>
                            )}
                          </div>
                          {mode === "billing" ? (
                            <button
                              type="button"
                              className={`pkg-cta${active ? " is-ghost" : ""}`}
                              disabled={active || busy}
                              onClick={() => checkout(plan.id, item)}
                            >
                              {active ? "Current plan" : busy ? "Redirecting…" : "Choose plan"}
                            </button>
                          ) : (
                            <Link href="/signup" className="pkg-cta">
                              {compareCta || ctaLabel}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <ul className="pkg-features">
                    {features.map((f) => (
                      <li key={f}>
                        <span className="pkg-check" aria-hidden>
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </ScrollMeetSplit>
        </section>
      ))}
    </div>
  );
}
