import { getAppUrl } from "@/lib/app-url";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return `${getAppUrl().replace(/\/$/, "")}/api/auth/google/callback`;
}

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: googleRedirectUri(),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("Failed to load Google profile");
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  if (!profile.sub || !profile.email) {
    throw new Error("Google account did not return email");
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
  };
}
