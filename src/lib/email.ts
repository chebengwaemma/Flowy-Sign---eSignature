import tls from "node:tls";
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

type SmtpSettings = { host: string; port: number; user: string; pass: string };

function smtpSettings(): SmtpSettings | null {
  const host = (process.env.SMTP_HOST || "").trim();
  const user = (process.env.SMTP_USER || "").trim();
  const pass = process.env.SMTP_PASS || "";
  const port = Number(process.env.SMTP_PORT || "465");
  if (!host || !user || !pass.trim()) return null;
  return { host, user, pass, port: Number.isFinite(port) && port > 0 ? port : 465 };
}

function dotStuff(body: string) {
  return body.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function smtpMessage(from: string, to: string, subject: string, text: string, html: string) {
  const boundary = `flowy_${Date.now().toString(36)}`;
  const encodedSubject = /^[\x20-\x7E]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  return dotStuff(
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      text,
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      html,
      `--${boundary}--`,
      "",
    ].join("\r\n"),
  );
}

/** Hostinger mailbox. Its SPF and DKIM are already on the domain, so Gmail can accept it. */
function sendViaSmtp(
  smtp: SmtpSettings,
  input: { to: string; subject: string; text: string; html: string },
): Promise<{ ok: boolean; error?: string }> {
  const from = `Flowy Sign <${smtp.user}>`;
  const data = smtpMessage(from, input.to, input.subject, input.text, input.html);
  return new Promise((resolve) => {
    const socket = tls.connect({ host: smtp.host, port: smtp.port, servername: smtp.host });
    let buf = "";
    let stage = 0;
    let settled = false;
    const finish = (result: { ok: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    const fail = (error: string) => finish({ ok: false, error: error.slice(0, 180) });
    const send = (line: string) => socket.write(`${line}\r\n`);

    socket.setTimeout(15_000, () => fail("SMTP timed out"));
    socket.on("error", (err) => fail(err.message));
    socket.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      if (!buf.includes("\n")) return;
      const parts = buf.split(/\r?\n/);
      buf = parts.pop() || "";
      for (const line of parts) {
        if (line.length < 4 || line[3] === "-") continue;
        const code = Number(line.slice(0, 3));
        if (stage === 0) {
          if (code !== 220) return fail(line);
          stage = 1;
          send("EHLO flowysign.com");
        } else if (stage === 1) {
          if (code !== 250) return fail(line);
          stage = 2;
          send("AUTH LOGIN");
        } else if (stage === 2) {
          if (code !== 334) return fail("SMTP auth rejected");
          stage = 3;
          send(Buffer.from(smtp.user).toString("base64"));
        } else if (stage === 3) {
          if (code !== 334) return fail("SMTP auth rejected");
          stage = 4;
          send(Buffer.from(smtp.pass).toString("base64"));
        } else if (stage === 4) {
          if (code !== 235) return fail("SMTP login failed");
          stage = 5;
          send(`MAIL FROM:<${smtp.user}>`);
        } else if (stage === 5) {
          if (code !== 250) return fail(line);
          stage = 6;
          send(`RCPT TO:<${input.to}>`);
        } else if (stage === 6) {
          if (code !== 250 && code !== 251) return fail(line);
          stage = 7;
          send("DATA");
        } else if (stage === 7) {
          if (code !== 354) return fail(line);
          stage = 8;
          socket.write(`${data}\r\n.\r\n`);
        } else if (stage === 8) {
          if (code !== 250) return fail(line);
          send("QUIT");
          finish({ ok: true });
        }
      }
    });
  });
}

/**
 * Sends email via the domain mailbox when SMTP is configured, otherwise Resend.
 * Without either, returns dryRun (in-app notification still works).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; dryRun?: boolean; error?: string }> {
  const to = (input.to || "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Invalid recipient" };
  }

  const smtp = smtpSettings();
  if (smtp) {
    const mailed = await sendViaSmtp(smtp, {
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (mailed.ok) {
      console.info("[email] smtp accepted");
      return { ok: true };
    }
    console.warn("[email] smtp failed", mailed.error || "unknown");
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
