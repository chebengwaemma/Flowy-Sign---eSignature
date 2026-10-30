"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SendActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);

  async function patch(next: string) {
    setLoading(true);
    setError("");
    setUpgradeNeeded(false);
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not update document");
      if (data.code === "PLAN_REQUIRED" || data.code === "SIGNATURE_LIMIT") {
        setUpgradeNeeded(true);
      }
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {status === "draft" && (
          <button className="btn btn-accent" disabled={loading} onClick={() => patch("sent")}>
            Send
          </button>
        )}
        {status !== "void" && status !== "completed" && (
          <button className="btn btn-ghost" disabled={loading} onClick={() => patch("void")}>
            Void
          </button>
        )}
      </div>
      {error && (
        <div className="rounded-xl border border-[#f0d9c8] bg-[#fff8f3] px-3 py-2 text-sm text-ink">
          <p>{error}</p>
          {upgradeNeeded && (
            <Link href="/billing" className="mt-2 inline-flex font-semibold text-accent-deep underline underline-offset-2">
              View packages & buy
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
