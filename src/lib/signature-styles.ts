import type { SignatureStyle } from "./types";

export const SIGNATURE_STYLES: Array<{
  id: SignatureStyle;
  label: string;
  hint: string;
}> = [
  { id: "elegant", label: "Elegant", hint: "Great Vibes" },
  { id: "script", label: "Script", hint: "Dancing Script" },
  { id: "formal", label: "Formal", hint: "Allura" },
  { id: "casual", label: "Casual", hint: "Satisfy" },
  { id: "marker", label: "Marker", hint: "Caveat" },
  { id: "classic", label: "Classic", hint: "Sacramento" },
];

/** Normalize legacy style ids from older documents */
export function normalizeSignatureStyle(style?: SignatureStyle | string): SignatureStyle {
  switch (style) {
    case "bold":
      return "marker";
    case "italic":
      return "script";
    case "slant":
      return "casual";
    case "strike":
      return "classic";
    case "elegant":
    case "script":
    case "formal":
    case "casual":
    case "marker":
    case "classic":
      return style;
    default:
      return "elegant";
  }
}

export function signatureClass(style?: SignatureStyle | string) {
  return `sig-mark sig-${normalizeSignatureStyle(style)}`;
}

export const SIGNATURE_STYLE_ENUM = [
  "elegant",
  "script",
  "formal",
  "casual",
  "marker",
  "classic",
  "bold",
  "italic",
  "slant",
  "strike",
] as const;
