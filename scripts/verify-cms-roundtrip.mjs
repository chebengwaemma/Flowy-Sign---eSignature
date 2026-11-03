/**
 * Verify admin CMS → store → public pages wiring (local check).
 * Usage: node scripts/verify-cms-roundtrip.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const marker = `CMS-CHECK-${Date.now()}`;
const uri = env.MONGODB_URI;
if (!uri) {
  console.error("FAIL no MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(uri);
const col = mongoose.connection.db.collection("platforms");
const doc = await col.findOne({ key: "main" });
if (!doc?.data?.site) {
  console.error("FAIL no platform site");
  process.exit(1);
}

const backup = structuredClone(doc.data);
const data = structuredClone(doc.data);
data.site.marketing = data.site.marketing || {};
data.site.marketing.home = data.site.marketing.home || {};
data.site.marketing.home.heroTitle = marker;
data.site.brandName = "Flowy CMS Test Brand";
data.site.plans = (data.site.plans || []).map((p) =>
  p.id === "starter" ? { ...p, monthly: 88, name: p.name || "Starter" } : p,
);

await col.updateOne({ key: "main" }, { $set: { data } });

const homeHtml = await fetch("http://localhost:3000/", { cache: "no-store" }).then((r) => r.text());
const pricingHtml = await fetch("http://localhost:3000/pricing", { cache: "no-store" }).then((r) =>
  r.text(),
);

const heroOk = homeHtml.includes(marker);
const brandOk = homeHtml.includes("Flowy CMS Test Brand");
const priceOk = /\$\s*88/.test(homeHtml) || /\$\s*88/.test(pricingHtml) || homeHtml.includes("$88");

await col.updateOne({ key: "main" }, { $set: { data: backup } });
await mongoose.disconnect();

const summary = heroOk && brandOk && priceOk ? "PASS" : "FAIL";
console.log(JSON.stringify({ heroOk, brandOk, priceOk, marker, summary }, null, 2));
process.exit(summary === "PASS" ? 0 : 1);
