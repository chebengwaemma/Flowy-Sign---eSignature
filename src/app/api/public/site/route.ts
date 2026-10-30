import { connection } from "next/server";
import { NextResponse } from "next/server";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public flags for login / signup UI (no secrets) — always live from Mongo */
export async function GET() {
  await connection();
  const store = await readStore();
  const s = mergeSettings(store.site);
  return NextResponse.json(
    {
      signupEnabled: s.signupEnabled,
      showGoogleLogin: s.showGoogleLogin,
      brandName: s.brandName,
      logoText: s.logoText,
      supportEmail: s.supportEmail,
      companyAddress: s.companyAddress,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
