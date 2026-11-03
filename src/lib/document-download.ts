import type { Document } from "./types";
import { buildSignedDocumentHtml } from "./signed-download";

function safeName(title: string, ext: string) {
  const base = (title || "document").replace(/[^\w\-]+/g, "_").slice(0, 60) || "document";
  return `${base}${ext}`;
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const data = match[3] || "";
  const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
  return { mime, buffer };
}

/** Build a downloadable payload for an uploaded / signed document. */
export function buildDocumentDownload(doc: Document): {
  filename: string;
  mime: string;
  body: Buffer | string;
} {
  if (doc.fileDataUrl) {
    const parsed = parseDataUrl(doc.fileDataUrl);
    if (parsed) {
      const ext =
        doc.fileKind === "pdf"
          ? ".pdf"
          : doc.fileKind === "image"
            ? mimeToExt(parsed.mime)
            : "";
      return {
        filename: safeName(doc.fileName || doc.title, ext || mimeToExt(parsed.mime)),
        mime: parsed.mime,
        body: parsed.buffer,
      };
    }
  }

  if (doc.status === "completed") {
    return {
      filename: safeName(doc.title, "-signed.html"),
      mime: "text/html; charset=utf-8",
      body: buildSignedDocumentHtml(doc),
    };
  }

  return {
    filename: safeName(doc.title, ".txt"),
    mime: "text/plain; charset=utf-8",
    body: doc.content || "",
  };
}

function mimeToExt(mime: string) {
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("pdf")) return ".pdf";
  return ".bin";
}
