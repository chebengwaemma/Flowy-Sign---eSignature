import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger VPS / Node hosting (node .next/standalone/server.js)
  output: "standalone",
  // Keep Turbopack CSS for local `next dev` only.
  // Production Hostinger builds use `next build --webpack` + postcss.config.mjs
  // to avoid Turbopack panic on globals.css → globals.css.css.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
