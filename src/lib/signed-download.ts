import type { Document, SignatureField } from "./types";
import { SIGNATURE_STYLES } from "./signature-styles";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markHtml(field: SignatureField) {
  const sig = field.signature;
  if (sig?.mode === "image" && sig.imageDataUrl) {
    return `<img src="${sig.imageDataUrl}" alt="Signature" style="max-width:100%;max-height:64px;object-fit:contain;" />`;
  }
  const text = escapeHtml(sig?.text || field.value || "");
  const style = sig?.style || "script";
  const styleMap: Record<string, string> = {
    elegant: "font-family:'Great Vibes',cursive;font-size:34px;",
    script: "font-family:'Dancing Script',cursive;font-size:30px;",
    formal: "font-family:Allura,cursive;font-size:34px;",
    casual: "font-family:Satisfy,cursive;font-size:30px;",
    marker: "font-family:Caveat,cursive;font-size:32px;font-weight:600;",
    classic: "font-family:Sacramento,cursive;font-size:34px;",
    bold: "font-family:'Permanent Marker',cursive;font-size:32px;",
    italic: "font-family:Parisienne,cursive;font-size:34px;",
    slant: "font-family:Satisfy,cursive;font-size:30px;font-style:italic;",
    strike: "font-family:Sacramento,cursive;font-size:32px;text-decoration:underline;",
  };
  return `<span style="${styleMap[style] || styleMap.elegant}">${text}</span>`;
}

/** Builds a standalone HTML signed copy — original content intact, marks overlaid. */
export function buildSignedDocumentHtml(doc: Document) {
  const fields = (doc.fields || []).filter((f) => f.value || f.signature);
  const marks = fields
    .map(
      (f) => `
      <div style="position:absolute;left:${f.x}%;top:${f.y}%;width:${f.width || 28}%;min-height:${f.height || 8}%;">
        ${markHtml(f)}
      </div>`,
    )
    .join("");

  let body = "";
  if (doc.fileKind === "image" && doc.fileDataUrl) {
    body = `<img src="${doc.fileDataUrl}" alt="${escapeHtml(doc.title)}" style="display:block;width:100%;height:auto;" />`;
  } else if (doc.fileKind === "pdf" && doc.fileDataUrl) {
    body = `
      <p style="margin:0 0 12px;color:#5a736e;font-size:13px;">Original PDF is embedded below. Signature marks are overlaid and do not alter the source file.</p>
      <embed src="${doc.fileDataUrl}" type="application/pdf" style="width:100%;min-height:70vh;border:1px solid #ddd;" />
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;line-height:1.6;margin-top:16px;">${escapeHtml(doc.content)}</pre>`;
  } else {
    body = `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:15px;line-height:1.7;margin:0;">${escapeHtml(doc.content)}</pre>`;
  }

  const stylesUsed = [
    ...new Set(fields.map((f) => f.signature?.style).filter(Boolean)),
  ]
    .map((id) => SIGNATURE_STYLES.find((s) => s.id === id)?.label || id)
    .join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)} — Signed</title>
  <style>
    body { margin: 0; background: #f4faf7; color: #062925; font-family: system-ui, sans-serif; }
    .wrap { max-width: 900px; margin: 24px auto; padding: 0 16px 48px; }
    .meta { margin-bottom: 16px; }
    .sheet { position: relative; background: #fff; border: 1px solid rgba(6,41,37,.12); border-radius: 12px; overflow: hidden; padding: 28px; box-shadow: 0 12px 40px rgba(6,41,37,.08); }
    h1 { font-size: 28px; margin: 0 0 4px; }
    .badge { display:inline-block; background:#e8f7ef; color:#0f7a4f; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="meta">
      <h1>${escapeHtml(doc.title)}</h1>
      <p><span class="badge">Completed &amp; signed</span>
        ${doc.completedAt ? ` · ${escapeHtml(new Date(doc.completedAt).toLocaleString())}` : ""}
      </p>
      <p style="color:#5a736e;font-size:13px;">
        Original document preserved. Signatures are overlays only.
        ${stylesUsed ? ` Styles used: ${escapeHtml(stylesUsed)}.` : ""}
      </p>
      <p style="color:#5a736e;font-size:13px;">Recipients: ${escapeHtml(
        (doc.recipients || []).map((r) => `${r.name || ""} <${r.email || ""}>`).join(", "),
      )}</p>
    </div>
    <div class="sheet">
      ${body}
      ${marks}
    </div>
  </div>
</body>
</html>`;
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSignedHtml(doc: Document) {
  const html = buildSignedDocumentHtml(doc);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const safe = doc.title.replace(/[^\w\-]+/g, "_").slice(0, 60) || "document";
  downloadBlob(`${safe}-signed.html`, blob);
}

/** Composite image document + signature overlays into a PNG download. */
export async function downloadSignedPng(doc: Document) {
  if (doc.fileKind !== "image" || !doc.fileDataUrl) {
    downloadSignedHtml(doc);
    return;
  }

  const img = await loadImage(doc.fileDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    downloadSignedHtml(doc);
    return;
  }

  ctx.drawImage(img, 0, 0);

  for (const field of doc.fields || []) {
    if (!field.value && !field.signature) continue;
    const x = (field.x / 100) * canvas.width;
    const y = (field.y / 100) * canvas.height;
    const w = ((field.width || 28) / 100) * canvas.width;

    if (field.signature?.mode === "image" && field.signature.imageDataUrl) {
      const mark = await loadImage(field.signature.imageDataUrl);
      const h = Math.min(mark.naturalHeight * (w / mark.naturalWidth), canvas.height * 0.12);
      ctx.drawImage(mark, x, y, w, h);
    } else {
      const text = field.signature?.text || field.value || "";
      const style = field.signature?.style || "elegant";
      ctx.fillStyle = "#0b1f1c";
      const size = Math.max(20, Math.min(52, w / Math.max(text.length * 0.4, 3.5)));
      const fontMap: Record<string, string> = {
        elegant: `${size}px "Great Vibes", cursive`,
        script: `${size}px "Dancing Script", cursive`,
        formal: `${size}px Allura, cursive`,
        casual: `${size}px Satisfy, cursive`,
        marker: `600 ${size}px Caveat, cursive`,
        classic: `${size}px Sacramento, cursive`,
        bold: `${size}px "Permanent Marker", cursive`,
        italic: `${size}px Parisienne, cursive`,
        slant: `italic ${size}px Satisfy, cursive`,
        strike: `${size}px Sacramento, cursive`,
      };
      ctx.font = fontMap[style] || fontMap.elegant;
      ctx.fillText(text, x, y + size, w);
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    downloadSignedHtml(doc);
    return;
  }
  const safe = doc.title.replace(/[^\w\-]+/g, "_").slice(0, 60) || "document";
  downloadBlob(`${safe}-signed.png`, blob);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
