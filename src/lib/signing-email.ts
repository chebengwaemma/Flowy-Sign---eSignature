import { getAppUrl } from "./app-url";
import { getEmailConfig, sendEmail } from "./email";
import { getSiteSettings } from "./get-marketing";
import type { Document, User } from "./types";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

export async function sendSigningInvitationEmails(doc: Document) {
  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  const brand = site.brandName || "Flowy Sign - eSignature";
  const results: { email: string; ok: boolean; dryRun?: boolean; error?: string }[] = [];

  for (const recipient of doc.recipients || []) {
    if (!recipient?.email || !recipient.token) continue;
    if (recipient.status === "signed") continue;

    const link = `${getAppUrl()}/sign/${encodeURIComponent(recipient.token)}`;
    const subject = `Please sign: ${doc.title}`;
    const text = [
      `Hi ${recipient.name || "there"},`,
      "",
      `You have been asked to sign "${doc.title}".`,
      "",
      `Sign here: ${link}`,
      "",
      `— ${brand}`,
    ].join("\n");

    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
        <p>Hi ${escapeHtml(recipient.name || "there")},</p>
        <p>You have been asked to sign <strong>${escapeHtml(doc.title)}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${escapeAttr(link)}"
             style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
            Review &amp; sign
          </a>
        </p>
        <p style="color:#64748b;font-size:13px">Or copy this URL:<br/>${escapeHtml(link)}</p>
        <p>— ${escapeHtml(brand)}</p>
      </div>
    `;

    const mail = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text,
      apiKey,
      from,
    });
    results.push({ email: recipient.email, ...mail });
  }

  const sent = results.filter((r) => r.ok && !r.dryRun).length;
  const dryRun = results.some((r) => r.dryRun);
  const failed = results.filter((r) => !r.ok).length;
  return { ok: failed === 0, sent, dryRun, failed, results };
}

export async function sendSigningCompleteEmail(owner: Pick<User, "email" | "name">, doc: Document) {
  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  const brand = site.brandName || "Flowy Sign - eSignature";
  const link = doc.downloadToken
    ? `${getAppUrl()}/download/${encodeURIComponent(doc.downloadToken)}`
    : `${getAppUrl()}/documents/${encodeURIComponent(doc.id)}`;
  const subject = `Completed: ${doc.title}`;
  const text = [
    `Hi ${owner.name || "there"},`,
    "",
    `All parties have signed "${doc.title}".`,
    "",
    `Open document: ${link}`,
    "",
    `— ${brand}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
      <p>Hi ${escapeHtml(owner.name || "there")},</p>
      <p>All parties have signed <strong>${escapeHtml(doc.title)}</strong>.</p>
      <p style="margin:24px 0">
        <a href="${escapeAttr(link)}"
           style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
          Open document
        </a>
      </p>
      <p>— ${escapeHtml(brand)}</p>
    </div>
  `;

  return sendEmail({
    to: owner.email,
    subject,
    html,
    text,
    apiKey,
    from,
  });
}

export async function sendTeamInviteEmail(input: {
  to: string;
  name: string;
  temporaryPassword: string;
  inviterName?: string;
}) {
  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  const brand = site.brandName || "Flowy Sign - eSignature";
  const loginUrl = `${getAppUrl()}/login`;
  const subject = `You're invited to ${brand}`;
  const text = [
    `Hi ${input.name || "there"},`,
    "",
    `${input.inviterName || "A teammate"} invited you to ${brand}.`,
    "",
    `Login: ${loginUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.temporaryPassword}`,
    "",
    "Please change your password after signing in.",
    "",
    `— ${brand}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
      <p>Hi ${escapeHtml(input.name || "there")},</p>
      <p>${escapeHtml(input.inviterName || "A teammate")} invited you to <strong>${escapeHtml(brand)}</strong>.</p>
      <p style="margin:24px 0">
        <a href="${escapeAttr(loginUrl)}"
           style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
          Sign in
        </a>
      </p>
      <p style="font-size:14px;color:#64748b">
        Email: ${escapeHtml(input.to)}<br/>
        Temporary password: <code>${escapeHtml(input.temporaryPassword)}</code>
      </p>
      <p style="font-size:13px;color:#64748b">Please change your password after signing in.</p>
      <p>— ${escapeHtml(brand)}</p>
    </div>
  `;

  return sendEmail({ to: input.to, subject, html, text, apiKey, from });
}
