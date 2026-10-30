import type { Metadata } from "next";
import {
  Allura,
  Caveat,
  Dancing_Script,
  Fraunces,
  Great_Vibes,
  Manrope,
  Sacramento,
  Satisfy,
} from "next/font/google";
import { SmartMotion } from "@/components/SmartMotion";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-sig-elegant",
  weight: "400",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-sig-script",
  subsets: ["latin"],
});

const allura = Allura({
  variable: "--font-sig-formal",
  weight: "400",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  variable: "--font-sig-casual",
  weight: "400",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-sig-marker",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  variable: "--font-sig-classic",
  weight: "400",
  subsets: ["latin"],
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
