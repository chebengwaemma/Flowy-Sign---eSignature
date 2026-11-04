import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const from = "Flowy Sign <noreply@flowysign.com>";
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db();
const names = (await db.listCollections().toArray()).map((n) => n.name);
console.log("collections", names);

for (const name of names.filter((n) => /platform/i.test(n))) {
  const before = await db.collection(name).findOne({});
  console.log(name, "before", before?.data?.site?.emailFrom || before?.site?.emailFrom);
  const r = await db.collection(name).updateMany({}, { $set: { "data.site.emailFrom": from } });
  console.log(name, "modified", r.modifiedCount);
  const after = await db.collection(name).findOne({});
  console.log(name, "after", after?.data?.site?.emailFrom);
}

await client.close();
