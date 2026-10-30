/**
 * Sync .env.local → Vercel (production, preview, development).
 * Usage after `npx vercel link`: node scripts/sync-vercel-env.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execFileSync } from "child_process";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const required = [
  "AUTH_SECRET",
  "ADMIN_AUTH_SECRET",
  "MONGODB_URI",
  "ADMIN_SEED_EMAIL",
  "ADMIN_SEED_PASSWORD",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_STARTER_YEARLY",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_YEARLY",
  "STRIPE_PRICE_BUSINESS_MONTHLY",
  "STRIPE_PRICE_BUSINESS_YEARLY",
];

const optional = ["STRIPE_WEBHOOK_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

const raw = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

for (const k of required) {
  if (!env[k]) {
    console.error(`Missing required ${k} in .env.local`);
    process.exit(1);
  }
}

let productionUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
try {
  const link = JSON.parse(readFileSync(resolve(root, ".vercel/project.json"), "utf8"));
  if (link.projectName) productionUrl = `https://${link.projectName}.vercel.app`;
} catch {
  /* keep */
}

const toSync = {
  ...Object.fromEntries(required.map((k) => [k, env[k]])),
  NEXT_PUBLIC_APP_URL: productionUrl,
};
for (const k of optional) {
  if (env[k]) toSync[k] = env[k];
}

function run(args, opts = {}) {
  return execFileSync("npx", ["vercel", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: opts.silent ? "ignore" : "inherit",
    shell: true,
    ...opts,
  });
}

for (const [key, value] of Object.entries(toSync)) {
  const isPublic = key.startsWith("NEXT_PUBLIC_");
  try {
    run(
      [
        "env",
        "add",
        key,
        "--environment",
        "production,preview,development",
        "--value",
        value,
        "--force",
        "--yes",
        ...(isPublic ? ["--no-sensitive"] : ["--sensitive"]),
      ],
      { silent: false },
    );
    console.log(`OK ${key}`);
  } catch (err) {
    console.error(`Failed ${key}:`, err.message || err);
    process.exit(1);
  }
}

console.log("\nSynced. NEXT_PUBLIC_APP_URL =", productionUrl);
console.log("Deploy: npx vercel --prod --yes");
