import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger VPS / Node hosting (node .next/standalone/server.js)
  output: "standalone",
  // Tailwind v4 via postcss.config.mjs (@tailwindcss/postcss).
  // Do NOT add turbopack CSS "as: *.css" rules — that creates globals.css.css and breaks builds.
  experimental: {
    // Hostinger shared hosts hit ulimit when Next spawns dozens of page-data workers
    // ("OS can't spawn worker thread: Resource temporarily unavailable").
    workerThreads: false,
    cpus: 1,
    // If Turbopack is used for CSS, prefer in-process workers over local-port helpers.
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
};

export default nextConfig;
