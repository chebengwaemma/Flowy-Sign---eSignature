import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getGeneratorQuota, monthKey } from "@/lib/generator-usage";
import { mergeSettings } from "@/lib/settings";
import { readStore, updateStore } from "@/lib/store";

/** Consume one signature-generator download against the user's plan quota */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await readStore();
  const settings = mergeSettings(store.site);
  if (!settings.signatureGeneratorEnabled) {
    return NextResponse.json({ error: "Signature generator is disabled by admin." }, { status: 403 });
  }

  const before = await getGeneratorQuota(user);
  if (!before.allowed) {
    return NextResponse.json(
      {
        error: before.message,
        code: user.plan === "free" ? "FREE_LIMIT" : "DOWNLOAD_LIMIT",
        upgradeUrl: "/billing",
        quota: before,
      },
      { status: 402 },
    );
  }

  const month = monthKey();
  let quota = before;

  await updateStore((s) => {
    const u = s.users.find((x) => x.id === user.id);
    if (!u) return;
    if (u.generatorDownloadMonth !== month) {
      u.generatorDownloadMonth = month;
      u.generatorDownloadCount = 0;
    }
    u.generatorDownloadCount = (u.generatorDownloadCount || 0) + 1;
  });

  const after = await readStore();
  const freshUser = after.users.find((x) => x.id === user.id) || user;
  quota = await getGeneratorQuota(freshUser);

  return NextResponse.json({ ok: true, quota });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ quota: await getGeneratorQuota(user) });
}
