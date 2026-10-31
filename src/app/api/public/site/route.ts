import { connection } from "next/server";
import { NextResponse } from "next/server";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public flags for login / signup UI (no secrets) — always live from Mongo */
export async function GET() {
  try {
    await connection();
    const store = await readStore();
    const s = mergeSettings(store.site);
    return NextResponse.json(
      {
        signupEnabled: s.signupEnabled !== false,
        showGoogleLogin: s.showGoogleLogin !== false,
        brandName: s.brandName || "Flowy Sign - eSignature",
        logoText: s.logoText || "Flowy Sign",
        supportEmail: s.supportEmail || "",
        companyAddress: s.companyAddress || "",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error("[api/public/site]", err);
    return NextResponse.json(
      {
        signupEnabled: true,
        showGoogleLogin: true,
        brandName: "Flowy Sign - eSignature",
        logoText: "Flowy Sign",
        supportEmail: "",
        companyAddress: "",
        warning: "settings_unavailable",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
