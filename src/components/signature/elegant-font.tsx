import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  variable: "--font-sig-elegant",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Landing sample signature. The other handwriting faces stay off the homepage. */
export const elegantFontClassName = greatVibes.variable;
