import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger VPS / Node hosting (node .next/standalone/server.js)
  output: "standalone",
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
