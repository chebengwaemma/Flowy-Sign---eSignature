import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing after loadEnv");
  }
  const { updateStore } = await import("../src/lib/store");
  const { defaultMarketing } = await import("../src/lib/marketing");
  await updateStore((s) => {
    s.site = { ...s.site, marketing: structuredClone(defaultMarketing) };
    return s;
  });
  console.log("OK:", defaultMarketing.about.title);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
