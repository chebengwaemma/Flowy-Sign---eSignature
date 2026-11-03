/**
 * Create Flowy Sign live (or test) Stripe products + prices if missing,
 * then print env lines to paste into .env.local.
 *
 * Usage: node scripts/ensure-stripe-prices.mjs
 * Reads STRIPE_SECRET_KEY from .env.local
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
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

const key = env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

async function stripe(path, method = "GET", body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return json;
}

const catalog = [
  { plan: "starter", name: "Flowy Sign Starter", monthly: 1500, yearly: 14400 },
  { plan: "pro", name: "Flowy Sign Pro", monthly: 3900, yearly: 37200 },
  { plan: "business", name: "Flowy Sign Business", monthly: 7900, yearly: 75600 },
];

const out = {};

for (const item of catalog) {
  const products = await stripe(
    `/products/search?query=${encodeURIComponent(`active:'true' AND name:'${item.name}'`)}`,
  );
  let product = products.data?.[0];
  if (!product) {
    product = await stripe("/products", "POST", {
      name: item.name,
      "metadata[plan]": item.plan,
    });
    console.log("Created product", item.name, product.id);
  } else {
    console.log("Found product", item.name, product.id);
  }

  async function ensurePrice(amount, interval) {
    const prices = await stripe(
      `/prices?product=${product.id}&active=true&limit=100`,
    );
    const existing = (prices.data || []).find(
      (p) =>
        p.unit_amount === amount &&
        p.currency === "usd" &&
        p.recurring?.interval === interval,
    );
    if (existing) {
      console.log(`  ${interval}: ${existing.id}`);
      return existing.id;
    }
    const created = await stripe("/prices", "POST", {
      product: product.id,
      unit_amount: String(amount),
      currency: "usd",
      "recurring[interval]": interval,
      "metadata[plan]": item.plan,
    });
    console.log(`  created ${interval}: ${created.id}`);
    return created.id;
  }

  out[`STRIPE_PRICE_${item.plan.toUpperCase()}_MONTHLY`] = await ensurePrice(
    item.monthly,
    "month",
  );
  out[`STRIPE_PRICE_${item.plan.toUpperCase()}_YEARLY`] = await ensurePrice(
    item.yearly,
    "year",
  );
}

let next = raw;
for (const [k, v] of Object.entries(out)) {
  const re = new RegExp(`^${k}=.*$`, "m");
  if (re.test(next)) next = next.replace(re, `${k}=${v}`);
  else next += `\n${k}=${v}`;
}
writeFileSync(envPath, next.endsWith("\n") ? next : next + "\n", "utf8");
console.log("\nUpdated .env.local with live/test price IDs:");
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
console.log("\nRestart next dev for changes to load.");
