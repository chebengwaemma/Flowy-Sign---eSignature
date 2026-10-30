"use client";

import { useState } from "react";
import type { BillingInterval, PlanId } from "@/lib/types";

type PlanCard = {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  features: string[];
};

export function BillingCards({
  currentPlan,
  currentInterval,
  plans,
}: {
  currentPlan: PlanId;
  currentInterval: BillingInterval | null;
  plans: PlanCard[];
}) {
  const [interval, setInterval] = useState<BillingInterval>(currentInterval || "monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function checkout(plan: PlanId) {
    if (plan === "free") return;
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
    <div className="space-y-5">
      {error && (
        <div className="panel border-[var(--bad)]/25 bg-[#fff5f3] px-5 py-4 text-sm" data-billing-result="unsuccess" role="alert">
          <p className="font-semibold text-[var(--bad)]">Payment unsuccessful</p>
          <p className="mt-1 text-muted">{error}</p>
          <button type="button" className="btn btn-primary mt-3" onClick={() => setError("")}>
            Try again
          </button>
        </div>
      )}
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

      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = interval === "monthly" ? plan.monthly : plan.yearly;
          const active = currentPlan === plan.id;
          return (
            <div key={plan.id} className={`panel flex flex-col p-5 ${active ? "ring-2 ring-accent" : ""}`}>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{plan.name}</p>
              <p className="display mt-2 text-4xl">
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
              <button
                type="button"
                className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
                disabled={active || plan.id === "free" || loading === plan.id}
                onClick={() => checkout(plan.id)}
              >
                {active ? "Current plan" : loading === plan.id ? "Redirecting…" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
