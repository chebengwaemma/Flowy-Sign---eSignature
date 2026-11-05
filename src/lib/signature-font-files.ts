import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeSignatureStyle } from "./signature-styles";

/**
 * SIL OFL 1.1 handwriting faces used when a signed file is downloaded.
 * A date uses the same face as the signature the signer chose.
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

export function fontKeyForField(
  field: { type: string; recipientId?: string; signature?: { style?: string } },
  doc?: { fields?: Array<{ type: string; recipientId?: string; signature?: { style?: string } }> },
): SignatureFontKey {
  const own = field.signature?.style;
  if (own && own in FILES) return own as SignatureFontKey;
  if (field.type === "date") {
    const match = doc?.fields?.find(
      (f) =>
        (f.type === "signature" || f.type === "initials") &&
        (!field.recipientId || f.recipientId === field.recipientId) &&
        f.signature?.style &&
        f.signature.style in FILES,
    );
    const borrowed = match?.signature?.style;
    if (borrowed && borrowed in FILES) return borrowed as SignatureFontKey;
  }
  const style = normalizeSignatureStyle(field.signature?.style);
  return style in FILES ? (style as SignatureFontKey) : "elegant";
}
