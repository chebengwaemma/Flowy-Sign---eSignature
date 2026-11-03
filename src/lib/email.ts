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

/** Resolve Resend credentials: explicit → CMS → env. */
export function getEmailConfig(
  site?: Pick<OrgSettings, "resendApiKey" | "emailFrom" | "supportEmail"> | null,
  overrides?: { apiKey?: string; from?: string },
): EmailConfig {
  const apiKey = (overrides?.apiKey || site?.resendApiKey || process.env.RESEND_API_KEY || "").trim();
  const from =
    (overrides?.from || site?.emailFrom || process.env.EMAIL_FROM || "").trim() ||
    `Flowy Sign <${site?.supportEmail || "onboarding@resend.dev"}>`;
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
    return { ok: true };
  } catch (err) {
    console.warn("[email] send failed", (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}
