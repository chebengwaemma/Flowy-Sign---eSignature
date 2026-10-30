"use client";

import { useState } from "react";
import type { Document } from "@/lib/types";
import { downloadSignedHtml, downloadSignedPng } from "@/lib/signed-download";

export function DownloadSignedButton({
  document: doc,
  className = "btn btn-accent",
}: {
  document: Document;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onDownload() {
    setBusy(true);
    try {
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
    <button type="button" className={className} disabled={busy} onClick={onDownload}>
      {busy ? "Preparing…" : "Download signed document"}
    </button>
  );
}
