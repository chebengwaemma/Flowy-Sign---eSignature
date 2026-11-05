import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fontKeyForField, signatureFontBytes, type SignatureFontKey } from "./signature-font-files";
import type { Document, SignatureField } from "./types";

function dataUrlBytes(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const data = match[3] || "";
  const bytes = isBase64
    ? Uint8Array.from(Buffer.from(data, "base64"))
    : Uint8Array.from(Buffer.from(decodeURIComponent(data), "utf8"));
  return { mime, bytes };
}

function filledFields(doc: Document) {
  return (doc.fields || []).filter((f) => !f.skipped && (f.value || f.signature));
}

const ink = rgb(0.04, 0.12, 0.11);

async function fontFor(
  pdf: PDFDocument,
  key: SignatureFontKey,
  embedded: Map<string, PDFFont>,
  fallback: PDFFont,
) {
  const hit = embedded.get(key);
  if (hit) return hit;
  try {
    const font = await pdf.embedFont(signatureFontBytes(key), { subset: true });
    embedded.set(key, font);
    return font;
  } catch {
    return fallback;
  }
}

async function drawField(
  pdf: PDFDocument,
  page: PDFPage,
  field: SignatureField,
  embedded: Map<string, PDFFont>,
  fallback: PDFFont,
) {
  const pageW = page.getWidth();
  const pageH = page.getHeight();
  const boxW = ((field.width || 28) / 100) * pageW;
  const boxH = Math.max(((field.height || 8) / 100) * pageH, 14);
  const x = (field.x / 100) * pageW;
  const y = pageH - (field.y / 100) * pageH - boxH;

  const imageUrl = field.signature?.mode === "image" ? field.signature.imageDataUrl : undefined;
  if (imageUrl) {
    const parsed = dataUrlBytes(imageUrl);
    if (parsed && (parsed.mime.includes("png") || parsed.mime.includes("jpeg") || parsed.mime.includes("jpg"))) {
      const image = parsed.mime.includes("png")
        ? await pdf.embedPng(parsed.bytes)
        : await pdf.embedJpg(parsed.bytes);
      const aspect = image.width / Math.max(image.height, 1);
      let drawW = boxW;
      let drawH = boxW / aspect;
      if (drawH > boxH) {
        drawH = boxH;
        drawW = boxH * aspect;
      }
      page.drawImage(image, { x, y: y + (boxH - drawH), width: drawW, height: drawH });
      return;
    }
  }

  const text = (field.signature?.text || field.value || "").trim();
  if (!text) return;
  const key = fontKeyForField(field);
  const font = await fontFor(pdf, key, embedded, fallback);
  let size = Math.max(field.type === "date" ? 11 : 14, boxH * (field.type === "date" ? 0.62 : 0.72));
  const widthAt = (px: number) => {
    try {
      return font.widthOfTextAtSize(text, px);
    } catch {
      return boxW + 1;
    }
  };
  if (widthAt(size) > boxW && widthAt(size) > 0 && widthAt(size) !== boxW + 1) {
    size = Math.max(8, size * (boxW / widthAt(size)));
  }
  const drawFont = widthAt(size) === boxW + 1 ? fallback : font;
  const originY = y + Math.max(2, (boxH - size) / 2);
  try {
    page.drawText(text, { x, y: originY, size, font: drawFont, color: ink });
  } catch {
    page.drawText(text.replace(/[^\x20-\x7e]/g, ""), {
      x,
      y: originY,
      size,
      font: fallback,
      color: ink,
    });
  }
  if (field.signature?.style === "strike") {
    const lineW = Math.min(boxW, drawFont.widthOfTextAtSize(text, size));
    page.drawLine({
      start: { x, y: y + 2 },
      end: { x: x + lineW, y: y + 2 },
      thickness: Math.max(0.6, size * 0.04),
      color: ink,
    });
  }
}

async function paintFields(pdf: PDFDocument, doc: Document, pageFor: (field: SignatureField) => PDFPage | undefined) {
  pdf.registerFontkit(fontkit);
  const fallback = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const embedded = new Map<string, PDFFont>();
  for (const field of filledFields(doc)) {
    const page = pageFor(field);
    if (!page) continue;
    try {
      await drawField(pdf, page, field, embedded, fallback);
    } catch (err) {
      console.warn("[download] skipped a mark:", (err as Error).message);
    }
  }
}

async function stampOntoPdf(bytes: Uint8Array, doc: Document) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  await paintFields(pdf, doc, (field) => pages[Math.max(0, (field.page || 1) - 1)] || pages[0]);
  return Buffer.from(await pdf.save());
}

async function imageToSignedPdf(bytes: Uint8Array, mime: string, doc: Document) {
  const pdf = await PDFDocument.create();
  const embedded = mime.includes("png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  await paintFields(pdf, doc, () => page);
  return Buffer.from(await pdf.save());
}

/** Burn placed signatures and dates into a copy of the file. Original upload is not modified. */
export async function stampSignatures(doc: Document, mime: string, bytes: Uint8Array): Promise<{
  mime: string;
  bytes: Buffer;
  ext: string;
} | null> {
  if (filledFields(doc).length === 0) return null;
  if (mime.includes("pdf") || doc.fileKind === "pdf") {
    const stamped = await stampOntoPdf(bytes, doc);
    return { mime: "application/pdf", bytes: stamped, ext: ".pdf" };
  }
  if (mime.includes("png") || mime.includes("jpeg") || mime.includes("jpg") || doc.fileKind === "image") {
    const stamped = await imageToSignedPdf(bytes, mime.includes("png") ? "image/png" : "image/jpeg", doc);
    return { mime: "application/pdf", bytes: stamped, ext: "-signed.pdf" };
  }
  return null;
}

export { dataUrlBytes };
