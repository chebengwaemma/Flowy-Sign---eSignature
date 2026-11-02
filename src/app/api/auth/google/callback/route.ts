import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tryCreateSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { deviceLabelFromRequest } from "@/lib/device-sessions";
import { exchangeGoogleCode, googleConfigured } from "@/lib/google-oauth";
import { findOrCreateGoogleUser } from "@/lib/store";

export async function GET(req: Request) {
  const appUrl = getAppUrl();
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
    const session = await tryCreateSession(user.id, deviceLabelFromRequest(req));
    if (!session.ok) {
      jar.set(
        "flowy_session_limit",
        JSON.stringify({
          error: session.error,
          code: session.code,
          max_sessions: session.max_sessions,
          active_sessions: session.active_sessions,
          pending_login_token: session.pending_login_token,
        }),
        {
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 300,
        },
      );
      return NextResponse.redirect(`${appUrl}/login?session_limit=1`);
    }
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("[google-oauth]", err);
    return fail("Google sign-in failed");
  }
}
