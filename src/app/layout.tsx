import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SmartMotion } from "@/components/SmartMotion";
import "./globals.css";

/** UI faces. Handwriting fonts load only on sign, send, and the generator. */
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
