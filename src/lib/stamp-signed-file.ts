import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

async function drawField(
  pdf: PDFDocument,
  page: ReturnType<PDFDocument["getPages"]>[number],
  field: SignatureField,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
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
    if (parsed) {
      const embedded = parsed.mime.includes("png")
        ? await pdf.embedPng(parsed.bytes)
        : await pdf.embedJpg(parsed.bytes);
      const aspect = embedded.width / Math.max(embedded.height, 1);
      let drawW = boxW;
      let drawH = boxW / aspect;
      if (drawH > boxH) {
        drawH = boxH;
        drawW = boxH * aspect;
      }
      page.drawImage(embedded, { x, y: y + (boxH - drawH), width: drawW, height: drawH });
      return;
    }
  }

  const text = (field.signature?.text || field.value || "").trim();
  if (!text) return;
  let size = Math.max(10, boxH * 0.72);
  const widthAt = (px: number) => font.widthOfTextAtSize(text, px);
  if (widthAt(size) > boxW && widthAt(size) > 0) {
    size = Math.max(8, size * (boxW / widthAt(size)));
  }
  page.drawText(text, {
    x,
    y: y + Math.max(2, (boxH - size) / 2),
    size,
    font,
    color: rgb(0.04, 0.12, 0.11),
  });
}

async function stampOntoPdf(bytes: Uint8Array, doc: Document) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const pages = pdf.getPages();
  for (const field of filledFields(doc)) {
    const page = pages[Math.max(0, (field.page || 1) - 1)] || pages[0];
    if (!page) continue;
    await drawField(pdf, page, field, font);
  }
  return Buffer.from(await pdf.save());
}

async function imageToSignedPdf(bytes: Uint8Array, mime: string, doc: Document) {
  const pdf = await PDFDocument.create();
  const embedded = mime.includes("png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  const font = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  for (const field of filledFields(doc)) {
    await drawField(pdf, page, field, font);
  }
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
