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
  const [interval, setInterval] = useState<BillingInterval>(currentInterval || "monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const order: Array<"pro" | "business"> = ["pro", "business"];
    return order
      .map((category) => ({
        category,
        label: planCategoryLabel(category),
        items: plans.filter((p) => p.category === category),
      }))
      .filter((g) => g.items.length > 0);
  }, [plans]);

  async function checkout(plan: PlanId) {
    if (mode !== "billing" || plan === "free") return;
    setLoading(plan);
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
    <div className="app-meet-page space-y-8">
      {error && (
        <ScrollMeetBlock side="right" distance={90}>
          <div
            className="panel border-[var(--bad)]/25 bg-[#fff5f3] px-5 py-4 text-sm"
            data-billing-result="unsuccess"
            role="alert"
          >
            <p className="font-semibold text-[var(--bad)]">Payment unsuccessful</p>
            <p className="mt-1 text-muted">{error}</p>
            <button type="button" className="btn btn-primary mt-3" onClick={() => setError("")}>
              Try again
            </button>
          </div>
        </ScrollMeetBlock>
      )}

      <ScrollMeetBlock side="left" distance={80}>
        <div className="inline-flex rounded-full border border-[var(--line)] bg-white/70 p-1">
          {(["monthly", "yearly"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                interval === item ? "bg-ink text-white" : "text-muted"
              }`}
              onClick={() => setInterval(item)}
            >
              {item}
              {item === "yearly" ? " · save ~20%" : ""}
            </button>
          ))}
        </div>
      </ScrollMeetBlock>

      {groups.map((group) => (
        <section key={group.category} className="space-y-4">
          <ScrollMeetBlock side={group.category === "pro" ? "left" : "right"} distance={90}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-deep">
                {group.label}
              </p>
              <h2 className="display mt-1 text-3xl text-ink">
                {group.label} plans
              </h2>
              <p className="mt-1 text-sm text-muted">
                All features unlimited · choose 1 device or up to 5 devices
              </p>
            </div>
          </ScrollMeetBlock>

          <ScrollMeetSplit
            className="grid gap-4 md:grid-cols-2 app-meet-grid"
            itemClassName="app-meet-item"
            distance={120}
            stagger={0.1}
          >
            {group.items.map((plan) => {
              const price = interval === "monthly" ? plan.monthly : plan.yearly;
              const active = mode === "billing" && currentPlan === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`panel flex h-full flex-col p-5 ${active ? "ring-2 ring-accent" : ""}`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {plan.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {plan.maxDevices <= 1
                      ? "Single user / 1 concurrent device"
                      : `Up to ${plan.maxDevices} concurrent devices`}
                  </p>
                  <p className="display mt-3 text-4xl">
                    ${price}
                    <span className="text-base text-muted">
                      /{interval === "monthly" ? "mo" : "yr"}
                    </span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                    {(plan.features || []).filter(Boolean).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  {mode === "billing" ? (
                    <button
                      type="button"
                      className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
                      disabled={active || loading === plan.id}
                      onClick={() => checkout(plan.id)}
                    >
                      {active ? "Current plan" : loading === plan.id ? "Redirecting…" : "Choose plan"}
                    </button>
                  ) : (
                    <Link href="/signup" className="btn btn-primary mt-5 inline-flex w-full justify-center">
                      {compareCta || ctaLabel}
                    </Link>
                  )}
                </article>
              );
            })}
          </ScrollMeetSplit>
        </section>
      ))}
    </div>
  );
}
