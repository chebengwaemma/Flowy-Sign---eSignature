import type { Document, SignatureField } from "./types";
import { SIGNATURE_STYLES } from "./signature-styles";
import { formatInTimeZone } from "./signing-time";

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
  const style = sig?.style || "elegant";
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script&family=Allura&family=Satisfy&family=Caveat:wght@600&family=Sacramento&family=Permanent+Marker&family=Parisienne&family=Kalam&display=swap" />
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
        ${doc.completedAt ? ` · ${escapeHtml(formatInTimeZone(new Date(doc.completedAt), doc.completedTimeZone || "UTC", true))}` : ""}
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
    const boxH = ((field.height || 8) / 100) * canvas.height;

    if (field.signature?.mode === "image" && field.signature.imageDataUrl) {
      const mark = await loadImage(field.signature.imageDataUrl);
      const aspect = mark.naturalWidth / Math.max(mark.naturalHeight, 1);
      let drawW = w;
      let drawH = w / aspect;
      if (drawH > boxH) {
        drawH = boxH;
        drawW = boxH * aspect;
      }
      ctx.drawImage(mark, x, y, drawW, drawH);
    } else {
      const text = field.signature?.text || field.value || "";
      const style =
        field.signature?.style ||
        (field.type === "date"
          ? doc.fields?.find(
              (f) =>
                (f.type === "signature" || f.type === "initials") &&
                f.recipientId === field.recipientId &&
                f.signature?.style,
            )?.signature?.style
          : undefined) ||
        "elegant";
      ctx.fillStyle = "#0b1f1c";
      // Fit typed signature inside the field box without clipping characters.
      let size = Math.max(10, boxH * 0.9);
      const family = (variable: string, fallback: string) => {
        if (typeof document === "undefined") return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
        return value || fallback;
      };
      const fontFor = (px: number) => {
        const fontMap: Record<string, string> = {
          elegant: `${px}px ${family("--font-sig-elegant", '"Great Vibes"')}, cursive`,
          script: `${px}px ${family("--font-sig-script", '"Dancing Script"')}, cursive`,
          formal: `${px}px ${family("--font-sig-formal", "Allura")}, cursive`,
          casual: `${px}px ${family("--font-sig-casual", "Satisfy")}, cursive`,
          marker: `600 ${px}px ${family("--font-sig-marker", "Caveat")}, cursive`,
          classic: `${px}px ${family("--font-sig-classic", "Sacramento")}, cursive`,
          bold: `${px}px ${family("--font-sig-bold", '"Permanent Marker"')}, cursive`,
          italic: `${px}px ${family("--font-sig-italic", "Parisienne")}, cursive`,
          slant: `italic ${px}px ${family("--font-sig-casual", "Satisfy")}, cursive`,
          strike: `${px}px ${family("--font-sig-classic", "Sacramento")}, cursive`,
          pen: `${px}px ${family("--font-sig-pen", "Kalam")}, cursive`,
        };
        return fontMap[style] || fontMap.elegant;
      };
      ctx.font = fontFor(size);
      let measured = ctx.measureText(text).width;
      if (measured > w && measured > 0) {
        size = Math.max(8, size * (w / measured));
        ctx.font = fontFor(size);
        measured = ctx.measureText(text).width;
      }
      const baseline = y + (boxH + size * 0.7) / 2;
      ctx.fillText(text, x, baseline);
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
