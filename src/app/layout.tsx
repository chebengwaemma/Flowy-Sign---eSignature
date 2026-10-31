import type { Metadata } from "next";
import {
  Allura,
  Caveat,
  Dancing_Script,
  Fraunces,
  Great_Vibes,
  Manrope,
  Parisienne,
  Permanent_Marker,
  Sacramento,
  Satisfy,
} from "next/font/google";
import { SmartMotion } from "@/components/SmartMotion";
import "./globals.css";

/** 10 site fonts: 2 UI + 8 signature styles */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-sig-elegant",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-sig-script",
  subsets: ["latin"],
  display: "swap",
});

const allura = Allura({
  variable: "--font-sig-formal",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const satisfy = Satisfy({
  variable: "--font-sig-casual",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-sig-marker",
  subsets: ["latin"],
  display: "swap",
});

const sacramento = Sacramento({
  variable: "--font-sig-classic",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  variable: "--font-sig-bold",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const parisienne = Parisienne({
  variable: "--font-sig-italic",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flowy Sign - eSignature",
  description:
    "Flowy Sign - eSignature: send, sign, and manage documents. Austell GA, USA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={[
        fraunces.variable,
        manrope.variable,
        greatVibes.variable,
        dancingScript.variable,
        allura.variable,
        satisfy.variable,
        caveat.variable,
        sacramento.variable,
        permanentMarker.variable,
        parisienne.variable,
        "h-full",
      ].join(" ")}
    >
      <body className="shell antialiased">
        {children}
        <SmartMotion />
      </body>
    </html>
  );
}
