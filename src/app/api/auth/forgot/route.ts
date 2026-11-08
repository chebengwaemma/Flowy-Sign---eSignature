import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailConfig, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/get-marketing";
import { findUserByEmail, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

function appOrigin() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://flowysign.com";
  return raw.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter the email on your account" }, { status: 400 });
  }

  const user = await findUserByEmail(body.data.email);
  // Google accounts are stored with an empty password. They still get a link
  // so the person can set a password and sign in from Gmail.
  if (user) {
    const token = randomBytes(24).toString("hex");
    const resetTokenHash = createHash("sha256").update(token).digest("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await updateStore((store) => {
      const row = store.users.find((u) => u.id === user.id);
      if (!row) return;
      row.resetTokenHash = resetTokenHash;
      row.resetTokenExpires = resetTokenExpires;
    });

    const site = await getSiteSettings();
    const { apiKey, from } = getEmailConfig(site);
    const brand = site.brandName || "Flowy Sign - eSignature";
    const link = `${appOrigin()}/reset-password?token=${token}`;
    const sent = await sendEmail({
      to: user.email,
      subject: `Reset your ${brand} password`,
      text: `Reset your password:\n${link}\n\nThis link works for 1 hour. If you do not see it, check spam.`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
        <p>Reset your ${brand} password. This link works for 1 hour.</p>
        <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Choose a new password</a></p>
        <p style="color:#64748b;font-size:13px">Or copy this link:<br/>${link}</p>
      </div>`,
      apiKey,
      from,
    });
    if (!sent.ok || sent.dryRun) {
      console.warn("[forgot] reset email was not accepted", sent.dryRun ? "dry-run" : sent.error || "failed");
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has a password account, a reset link is on the way.",
  });
}
