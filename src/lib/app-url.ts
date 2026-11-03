/**
 * Public app origin for absolute links (Stripe, OAuth, emails).
 * Prefers NEXT_PUBLIC_APP_URL when it is a real non-localhost URL;
 * otherwise uses Vercel deployment URL, then localhost for dev.
 */
export function getAppUrl() {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return configured;
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return configured || "http://localhost:3000";
}
