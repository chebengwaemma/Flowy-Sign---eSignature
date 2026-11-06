import {
  Allura,
  Caveat,
  Dancing_Script,
  Great_Vibes,
  Kalam,
  Parisienne,
  Permanent_Marker,
  Sacramento,
  Satisfy,
} from "next/font/google";

const greatVibes = Great_Vibes({
  variable: "--font-sig-elegant",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const dancingScript = Dancing_Script({
  variable: "--font-sig-script",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const allura = Allura({
  variable: "--font-sig-formal",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const satisfy = Satisfy({
  variable: "--font-sig-casual",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const caveat = Caveat({
  variable: "--font-sig-marker",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const sacramento = Sacramento({
  variable: "--font-sig-classic",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const permanentMarker = Permanent_Marker({
  variable: "--font-sig-bold",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const parisienne = Parisienne({
  variable: "--font-sig-italic",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const kalam = Kalam({
  variable: "--font-sig-pen",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/** Handwriting faces. Import only on sign, send, and the generator — not the whole site. */
export const signatureFontsClassName = [
  greatVibes.variable,
  dancingScript.variable,
  allura.variable,
  satisfy.variable,
  caveat.variable,
  sacramento.variable,
  permanentMarker.variable,
  parisienne.variable,
  kalam.variable,
].join(" ");
