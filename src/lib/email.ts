import type { OrgSettings } from "./types";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional overrides (Admin CMS); else env */
  apiKey?: string;
  from?: string;
};

export type EmailConfig = {
  apiKey: string;
  from: string;
};

const LIVE_FROM = "Flowy Sign <noreply@flowysign.com>";

function isResendTestFrom(from: string) {
  return /onboarding@resend\.dev/i.test(from);
}

/** Resolve Resend credentials: explicit → env (live) → CMS. Never keep Resend test sender in prod. */
export function getEmailConfig(
  site?: Pick<OrgSettings, "resendApiKey" | "emailFrom" | "supportEmail"> | null,
  overrides?: { apiKey?: string; from?: string },
): EmailConfig {
  const envKey = (process.env.RESEND_API_KEY || "").trim();
  const envFrom = (process.env.EMAIL_FROM || "").trim();
  const siteKey = (site?.resendApiKey || "").trim();
  const siteFrom = (site?.emailFrom || "").trim();

  const apiKey = (overrides?.apiKey || envKey || siteKey || "").trim();

  let from = (overrides?.from || envFrom || siteFrom || "").trim();
  if (!from || isResendTestFrom(from)) {
    from = envFrom && !isResendTestFrom(envFrom) ? envFrom : LIVE_FROM;
  }
  return { apiKey, from };
}

/**
 * Sends email via Resend.
 * Priority: input.apiKey → RESEND_API_KEY env.
 * Without a key, returns dryRun (in-app notification still works).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; dryRun?: boolean; error?: string }> {
  const to = (input.to || "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Invalid recipient" };
  }

  const { apiKey, from } = getEmailConfig(null, { apiKey: input.apiKey, from: input.from });

  if (!apiKey) {
    console.info("[email:dry-run]", {
      from,
      to,
      subject: input.subject,
      text: input.text.slice(0, 500),
    });
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[email] Resend failed", res.status, body.slice(0, 400));
      return { ok: false, error: `Email provider error (${res.status})` };
    }
    console.info("[email] accepted", res.status);
    return { ok: true };
  } catch (err) {
    console.warn("[email] send failed", (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}
