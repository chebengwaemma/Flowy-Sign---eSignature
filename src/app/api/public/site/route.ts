import { NextResponse } from "next/server";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";

/** Public flags for login / signup UI (no secrets) */
export async function GET() {
  const store = await readStore();
  const s = mergeSettings(store.site);
  return NextResponse.json({
    signupEnabled: s.signupEnabled,
    showGoogleLogin: s.showGoogleLogin,
    brandName: s.brandName,
  });
}
