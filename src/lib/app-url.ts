/**
 * Public app origin for absolute links (Stripe, OAuth, emails).
 * Never emits localhost when running on Vercel / production.
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

  // Production Node (Hostinger etc.) with a bad/missing APP_URL — prefer the live domain.
  if (process.env.NODE_ENV === "production") {
    return "https://flowysign.com";
  }

  return configured || "http://localhost:3000";
}
