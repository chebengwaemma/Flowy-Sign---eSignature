"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import type { BillingInterval, PlanId } from "@/lib/types";

export function BillingResult({
  success,
  canceled,
  demo,
  stripePending,
  plan,
  interval,
  sessionId,
}: {
  success?: boolean;
  canceled?: boolean;
  demo?: boolean;
  stripePending?: boolean;
  plan?: string;
  interval?: string;
  sessionId?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(Boolean(success && sessionId));
  const [confirmError, setConfirmError] = useState("");
  const [resolvedPlan, setResolvedPlan] = useState(plan);
  const [resolvedInterval, setResolvedInterval] = useState(interval || "monthly");

  useEffect(() => {
    if (!success || !sessionId) return;
    let cancelled = false;
    (async () => {
      setConfirming(true);
      setConfirmError("");
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.result === "unsuccess") {
          setConfirmError(data.error || "Could not confirm payment.");
          setConfirming(false);
          return;
        }
        setResolvedPlan(data.plan || plan);
        setResolvedInterval(data.interval || interval || "monthly");
        setConfirming(false);
        router.refresh();
      } catch {
        if (!cancelled) {
          setConfirmError("Network error while confirming payment.");
          setConfirming(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [success, sessionId, plan, interval, router]);

  const planMeta = PLANS.find((p) => p.id === resolvedPlan);
  const price =
    planMeta && resolvedInterval === "yearly" ? planMeta.yearly : planMeta?.monthly;

  if (success) {
    if (confirmError) {
      return (
        <div className="panel border-[var(--bad)]/25 bg-[#fff5f3] px-5 py-4 text-sm" data-billing-result="unsuccess" role="alert">
          <p className="text-base font-semibold text-[var(--bad)]">Payment unsuccessful</p>
          <p className="mt-1 text-muted">{confirmError}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => router.push("/billing")}>
            Try again
          </button>
        </div>
      );
    }

    return (
      <div
        className="panel border-accent/30 bg-mist/80 px-5 py-4 text-sm"
        role="status"
        data-billing-result="success"
      >
        <p className="text-base font-semibold text-accent-deep">Payment successful</p>
        {confirming ? (
          <p className="mt-1 text-muted">Confirming your purchase…</p>
        ) : (
          <>
            <p className="mt-2 font-semibold text-ink">
              You purchased: {planMeta?.name || resolvedPlan || "plan"}{" "}
              {resolvedInterval ? `(${resolvedInterval})` : ""}
              {typeof price === "number" ? ` · $${price}` : ""}
            </p>
            {planMeta && (
              <ul className="mt-2 space-y-1 text-muted">
                {planMeta.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-muted">
              {demo
                ? stripePending
                  ? "Applied in demo mode while Stripe finishes card activation."
                  : "Applied in demo mode."
                : "Your subscription is active on this workspace."}
            </p>
          </>
        )}
      </div>
    );
  }

  if (canceled) {
    const tryPlan = (plan as PlanId) || "starter";
    const tryInterval = (interval as BillingInterval) || "monthly";
    return (
      <div
        className="panel border-[var(--bad)]/25 bg-[#fff5f3] px-5 py-4 text-sm"
        role="status"
        data-billing-result="unsuccess"
      >
        <p className="text-base font-semibold text-[var(--bad)]">Payment unsuccessful</p>
        <p className="mt-1 text-muted">
          Checkout was canceled or did not complete. No charge was made
          {plan ? ` for ${PLANS.find((p) => p.id === plan)?.name || plan}` : ""}.
        </p>
        <TryAgainButton plan={tryPlan} interval={tryInterval} />
      </div>
    );
  }

  return null;
}

function TryAgainButton({ plan, interval }: { plan: PlanId; interval: BillingInterval }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not restart checkout.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="mt-4">
      {error && <p className="mb-2 text-[var(--bad)]">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={loading} onClick={retry}>
        {loading ? "Starting checkout…" : "Try again"}
      </button>
    </div>
  );
}
