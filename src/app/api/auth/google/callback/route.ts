import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { exchangeGoogleCode, googleConfigured } from "@/lib/google-oauth";
import { findOrCreateGoogleUser } from "@/lib/store";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fail = (msg: string) =>
    NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(msg)}`);

  if (!googleConfigured()) {
    return fail("Google login is not configured");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return fail("Google sign-in was cancelled");
  if (!code || !state) return fail("Invalid Google callback");

  const jar = await cookies();
  const saved = jar.get("flowy_google_oauth_state")?.value;
  jar.delete("flowy_google_oauth_state");
  if (!saved || saved !== state) return fail("Invalid OAuth state");

  try {
    const profile = await exchangeGoogleCode(code);
    const user = await findOrCreateGoogleUser(profile);
    await createSession(user.id);
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("[google-oauth]", err);
    return fail("Google sign-in failed");
  }
}
