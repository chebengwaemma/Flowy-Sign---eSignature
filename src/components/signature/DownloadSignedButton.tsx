"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/types";
import { downloadSignedHtml, downloadSignedPng } from "@/lib/signed-download";

export function DownloadSignedButton({
  document: doc,
  className = "btn btn-accent",
}: {
  document: Document;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDownload() {
    setBusy(true);
    setError("");
    try {
      if (doc.downloadToken) {
        const res = await fetch(`/api/download/${encodeURIComponent(doc.downloadToken)}`);
        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          router.push(data.billingUrl || `/billing?reason=download&token=${doc.downloadToken}`);
          return;
        }
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/download/${doc.downloadToken}`)}`);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Download blocked");
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
        return;
      }

      // Legacy docs without downloadToken — still require billing gate via client check endpoint
      const gate = await fetch("/api/download/gate", { method: "POST" });
      if (gate.status === 402) {
        router.push("/billing?reason=download");
        return;
      }
      if (doc.fileKind === "image" && doc.fileDataUrl) {
        await downloadSignedPng(doc);
      } else {
        downloadSignedHtml(doc);
      }
    } finally {
      setBusy(false);
    }
  }

  if (doc.status !== "completed") return null;

  return (
    <div>
      {error ? <p className="mb-2 text-sm text-[var(--bad)]">{error}</p> : null}
      <button type="button" className={className} disabled={busy} onClick={onDownload}>
        {busy ? "Preparing…" : "Download signed document"}
      </button>
    </div>
  );
}
