import type { Document } from "./types";
import { readStoredFile } from "./file-bin";
import { buildSignedDocumentHtml } from "./signed-download";
import { dataUrlBytes, stampSignatures } from "./stamp-signed-file";

function safeName(title: string, ext: string) {
  const base = (title || "document").replace(/[^\w\-]+/g, "_").slice(0, 60) || "document";
  return `${base}${ext}`;
}

/** Build a downloadable payload for an uploaded / signed document. */
export async function buildDocumentDownload(doc: Document): Promise<{
  filename: string;
  mime: string;
  body: Buffer | string;
}> {
  let mime = "";
  let bytes: Uint8Array | null = null;
  if (doc.fileId) {
    const stored = await readStoredFile(doc.fileId);
    if (stored) {
      mime = stored.mime;
      bytes = stored.bytes;
    }
  }
  if (!bytes && doc.fileDataUrl) {
    const parsed = dataUrlBytes(doc.fileDataUrl);
    if (parsed) {
      mime = parsed.mime;
      bytes = parsed.bytes;
    }
  }
  if (bytes && mime) {
      try {
        const stamped = await stampSignatures(doc, mime, bytes);
        if (stamped) {
          return {
            filename: safeName(doc.title, stamped.ext.startsWith("-") ? stamped.ext : `-signed${stamped.ext}`),
            mime: stamped.mime,
            body: stamped.bytes,
          };
        }
      } catch (err) {
        console.warn("[download] could not stamp signatures:", (err as Error).message);
      }
      const ext =
        doc.fileKind === "pdf"
          ? ".pdf"
          : doc.fileKind === "image"
            ? mimeToExt(mime)
            : "";
      return {
        filename: safeName(doc.fileName || doc.title, ext || mimeToExt(mime)),
        mime,
        body: Buffer.from(bytes),
      };
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
