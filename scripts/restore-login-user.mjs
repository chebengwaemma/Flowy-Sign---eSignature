/**
 * One-shot: ensure app login users exist in Mongo platform store.
 * Keeps existing site CMS / docs; only backfills empty users.
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const uri = readFileSync(".env.local", "utf8").match(/MONGODB_URI=(.+)/)?.[1]?.trim();
if (!uri) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

const now = new Date().toISOString();
const orgId = "org_main";

const users = [
  {
    id: "user_owner",
    email: "mursalinshariif00@gmail.com",
    name: "Mursalin Sharif",
    password: "FlowyLogin@2026",
    role: "owner",
    orgId,
    plan: "free",
    billingInterval: null,
    createdAt: now,
    packageType: "none",
    subscriptionStatus: "inactive",
    activeDevicesCount: 0,
    maxConcurrentSessions: 1,
  },
  {
    id: "user_admin_app",
    email: "admin@flowysign.com",
    name: "Flowy Admin",
    password: "admin123",
    role: "owner",
    orgId,
    plan: "pro",
    billingInterval: "monthly",
    createdAt: now,
    packageType: "personal",
    subscriptionStatus: "active",
    activeDevicesCount: 0,
    maxConcurrentSessions: 5,
    packageActivatedAt: now,
  },
];

const org = {
  id: orgId,
  name: "Flowy Sign",
  ownerId: "user_owner",
  plan: "free",
  settings: {},
  createdAt: now,
};

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
await client.connect();
const col = client.db().collection("platforms");
const doc = await col.findOne({ key: "main" });
if (!doc?.data) {
  console.error("No platform main document");
  process.exit(1);
}

const data = doc.data;
const existing = Array.isArray(data.users) ? data.users : [];
console.log("before_users", existing.length);

const byEmail = new Map(existing.map((u) => [(u.email || "").toLowerCase(), u]));
for (const u of users) {
  const key = u.email.toLowerCase();
  if (!byEmail.has(key)) byEmail.set(key, u);
  else {
    // Keep account but ensure password login works again if wiped.
    const cur = byEmail.get(key);
    byEmail.set(key, {
      ...cur,
      password: cur.password || u.password,
      name: cur.name || u.name,
      role: cur.role || u.role,
      orgId: cur.orgId || u.orgId,
    });
  }
}

data.users = [...byEmail.values()];
if (!Array.isArray(data.organizations) || data.organizations.length === 0) {
  data.organizations = [org];
}

const rev = typeof doc.rev === "number" ? doc.rev : 0;
const res = await col.updateOne(
  { key: "main", rev },
  { $set: { data, rev: rev + 1, updatedAt: new Date() } },
);
console.log("matched", res.matchedCount, "modified", res.modifiedCount, "after_users", data.users.length);
console.log(
  "emails",
  data.users.map((u) => u.email).join(", "),
);
await client.close();
