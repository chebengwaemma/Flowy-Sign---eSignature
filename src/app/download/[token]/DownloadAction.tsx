"use client";

import { useState } from "react";

export function DownloadAction({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/download/${encodeURIComponent(token)}`);
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        window.location.href = data.billingUrl || `/billing?reason=download&token=${token}`;
        return;
      }
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/download/${token}`)}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Download failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/i.exec(disposition);
      const filename = match?.[1] || "document";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {error ? <p className="mb-3 text-sm text-[var(--bad)]">{error}</p> : null}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onClick}>
        {busy ? "Preparing…" : "Download document"}
      </button>
    </div>
  );
}
