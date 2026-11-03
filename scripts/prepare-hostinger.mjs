/**
 * After `npm run build` (standalone), copy static + public into the standalone folder
 * so Hostinger Node / VPS can run: node .next/standalone/server.js
 */
import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const staticSrc = join(root, ".next", "static");
const publicSrc = join(root, "public");

if (!existsSync(standalone)) {
  console.error("Missing .next/standalone — set output: 'standalone' and run npm run build first.");
  process.exit(1);
}

mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(staticSrc, join(standalone, ".next", "static"), { recursive: true });
if (existsSync(publicSrc)) {
  cpSync(publicSrc, join(standalone, "public"), { recursive: true });
}

console.log("Hostinger package ready:");
console.log("  Upload/run from .next/standalone");
console.log("  Start: PORT=3000 node server.js");
console.log("  Required env: MONGODB_URI, AUTH_SECRET, ADMIN_AUTH_SECRET, NEXT_PUBLIC_APP_URL");
