import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailConfig, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/get-marketing";
import { hashSecret, makeResetOtp, makeResetToken } from "@/lib/password-reset";
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
    const token = makeResetToken();
    const code = makeResetOtp();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await updateStore((store) => {
      const row = store.users.find((u) => u.id === user.id);
      if (!row) return;
      row.resetTokenHash = hashSecret(token);
      row.resetTokenExpires = resetTokenExpires;
      row.resetOtpHash = hashSecret(code);
      row.resetOtpExpires = resetOtpExpires;
      row.resetOtpAttempts = 0;
    });

    const site = await getSiteSettings();
    const { apiKey, from } = getEmailConfig(site);
    const brand = site.brandName || "Flowy Sign - eSignature";
    const safeBrand = brand.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const link = `${appOrigin()}/reset-password?token=${token}`;
    const sent = await sendEmail({
      to: user.email,
      subject: `Reset your ${brand} password`,
      text: `Your reset code is ${code}. It works for 15 minutes.\n\nOr open this link (1 hour):\n${link}\n\nIf you do not see this email, check spam.`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
        <p>Reset your ${safeBrand} password.</p>
        <p style="margin:24px 0;font-size:32px;letter-spacing:0.28em;font-weight:700">${code}</p>
        <p>Enter this 6-digit code on the forgot-password page. It works for 15 minutes.</p>
        <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Choose a new password</a></p>
        <p style="color:#64748b;font-size:13px">Or copy this link. It works for 1 hour:<br/>${link}</p>
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
    message: "If that email has an account, a reset link and a 6-digit code are on the way. Check inbox and spam.",
  });
}
