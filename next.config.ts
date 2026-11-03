import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger VPS / Node hosting (node .next/standalone/server.js)
  output: "standalone",
  // Tailwind v4 via postcss.config.mjs (@tailwindcss/postcss).
  // Do NOT add turbopack CSS "as: *.css" rules — that creates globals.css.css and breaks builds.
};

export default nextConfig;
