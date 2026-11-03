import { getAppUrl } from "./app-url";
import { getEmailConfig, sendEmail } from "./email";
import { createUserNotification } from "./notifications";
import { getSiteSettings } from "./get-marketing";
import type { Document, User } from "./types";

export function documentDownloadPath(token: string) {
  return `/download/${encodeURIComponent(token)}`;
}

export function documentDownloadUrl(token: string) {
  return `${getAppUrl()}${documentDownloadPath(token)}`;
}

/** Notify the account owner that their uploaded document is ready (in-app + email). */
export async function sendDocumentReadyEmail(user: User, doc: Document) {
  const token = doc.downloadToken;
  if (!token) return { ok: false, error: "Missing download token" };

  const path = documentDownloadPath(token);
  const link = documentDownloadUrl(token);
  const brand = "Flowy Sign - eSignature";
  const subject = `${doc.title} is ready to download`;
  const text = [
    `Hi ${user.name || "there"},`,
    "",
    `Your document "${doc.title}" was uploaded successfully and is ready.`,
    "",
    `Download link: ${link}`,
    "",
    "If you do not have an active paid plan, you will be asked to subscribe before the file downloads.",
    "",
    `— ${brand}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
      <p>Hi ${escapeHtml(user.name || "there")},</p>
      <p>Your document <strong>${escapeHtml(doc.title)}</strong> was uploaded successfully and is ready.</p>
      <p style="margin:24px 0">
        <a href="${escapeAttr(link)}"
           style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
          Download document
        </a>
      </p>
      <p style="color:#64748b;font-size:14px">
        If you do not have an active paid plan, this link will take you to subscription packages before download unlocks.
      </p>
      <p style="color:#64748b;font-size:13px">Or copy this URL:<br/>${escapeHtml(link)}</p>
      <p>— ${escapeHtml(brand)}</p>
    </div>
  `;

  // Always deliver in-app so the flow works without an email provider key
  await createUserNotification({
    userId: user.id,
    type: "document_ready",
    title: subject,
    body: `Your document "${doc.title}" is ready. Open the download link — a paid plan is required to save the file.`,
    href: path,
    documentId: doc.id,
  });

  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    apiKey,
    from,
  });
}

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
