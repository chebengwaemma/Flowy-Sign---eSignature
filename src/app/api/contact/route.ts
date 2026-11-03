import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailConfig, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/get-marketing";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = schema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Please fill name, email, and a short message." }, { status: 400 });
  }

  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  const supportTo = (site.supportEmail || "help@flowysign.com").trim().toLowerCase();
  const subject = body.data.subject?.trim() || `Contact form — ${body.data.name}`;
  const text = [
    `From: ${body.data.name} <${body.data.email}>`,
    "",
    body.data.message,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
      <p><strong>From:</strong> ${escapeHtml(body.data.name)} &lt;${escapeHtml(body.data.email)}&gt;</p>
      <p style="white-space:pre-wrap">${escapeHtml(body.data.message)}</p>
    </div>
  `;

  const mail = await sendEmail({
    to: supportTo,
    subject,
    html,
    text,
    apiKey,
    from,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: mail.error || "Could not send message" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    emailSent: !mail.dryRun,
    emailDryRun: Boolean(mail.dryRun),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
