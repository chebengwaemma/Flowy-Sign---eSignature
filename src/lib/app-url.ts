/**
 * Public app origin for absolute links (Stripe, OAuth, emails).
 * Always the live site — never localhost / 127.0.0.1.
 */
export function getAppUrl() {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return configured;
  }
  return "https://flowysign.com";
}
