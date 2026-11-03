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
  { id: "bold", label: "Bold", hint: "Permanent Marker" },
  { id: "italic", label: "Italic", hint: "Parisienne" },
  { id: "slant", label: "Slant", hint: "Satisfy italic" },
  { id: "strike", label: "Strike", hint: "Sacramento underline" },
];

/** Normalize unknown / empty style ids */
export function normalizeSignatureStyle(style?: SignatureStyle | string): SignatureStyle {
  switch (style) {
    case "elegant":
    case "script":
    case "formal":
    case "casual":
    case "marker":
    case "classic":
    case "bold":
    case "italic":
    case "slant":
    case "strike":
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
