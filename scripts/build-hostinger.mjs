/**
 * Hostinger-safe production build: webpack + low concurrency + modest heap.
 * Use as the hPanel build command: npm run build:hostinger
 */
import { spawnSync } from "child_process";

process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, "--max-old-space-size=2048"]
  .filter(Boolean)
  .join(" ")
  .trim();

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "build", "--webpack"],
  { stdio: "inherit", env: process.env, shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
