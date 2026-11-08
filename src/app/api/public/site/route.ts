import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/get-marketing";

export const dynamic = "force-dynamic";

/** Public flags for login / signup UI (no secrets) */
export async function GET() {
  try {
    const s = await getSiteSettings();
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
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  }
}
