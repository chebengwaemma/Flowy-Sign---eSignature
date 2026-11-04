import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { getAppUrl } from "@/lib/app-url";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google-oauth";

export async function GET() {
  const base = getAppUrl();

  if (!googleConfigured()) {
    const login = new URL("/login", base);
    login.searchParams.set(
      "error",
      "Google login needs keys. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local (from Google Cloud Console).",
    );
    return NextResponse.redirect(login);
  }

  const state = nanoid(24);
  const jar = await cookies();
  jar.set("flowy_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
