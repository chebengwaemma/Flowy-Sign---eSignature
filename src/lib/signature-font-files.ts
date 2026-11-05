import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeSignatureStyle } from "./signature-styles";

/**
 * SIL OFL 1.1 handwriting faces used when a signed file is downloaded.
 * Signature uses the style the signer picked. Dates use Kalam (pen).
 */
const FILES = {
  elegant: "GreatVibes-Regular.ttf",
  script: "DancingScript-Regular.ttf",
  formal: "Allura-Regular.ttf",
  casual: "Satisfy-Regular.ttf",
  marker: "Caveat-SemiBold.ttf",
  classic: "Sacramento-Regular.ttf",
  bold: "PermanentMarker-Regular.ttf",
  italic: "Parisienne-Regular.ttf",
  slant: "Satisfy-Regular.ttf",
  strike: "Sacramento-Regular.ttf",
  pen: "Kalam-Regular.ttf",
} as const;

export type SignatureFontKey = keyof typeof FILES;

const cache = new Map<string, Uint8Array>();

function readFont(file: string) {
  const hit = cache.get(file);
  if (hit) return hit;
  const bytes = readFileSync(path.join(process.cwd(), "src", "lib", "fonts", file));
  const view = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  cache.set(file, view);
  return view;
}

export function signatureFontBytes(key: string): Uint8Array {
  const file = FILES[key as SignatureFontKey] || FILES.elegant;
  return readFont(file);
}

export function fontKeyForField(field: { type: string; signature?: { style?: string } }): SignatureFontKey {
  if (field.type === "date") return "pen";
  const style = normalizeSignatureStyle(field.signature?.style);
  return style in FILES ? (style as SignatureFontKey) : "elegant";
}
