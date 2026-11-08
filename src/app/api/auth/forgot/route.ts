import { after, NextResponse } from "next/server";
import { z } from "zod";
import { hashSecret, makeResetOtp, makeResetToken } from "@/lib/password-reset";
import { drainResetMailQueue, enqueuePasswordReset } from "@/lib/reset-mail";
import { getSiteSettings } from "@/lib/get-marketing";
import { findUserByEmail, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

const GENERIC = {
  ok: true,
  message: "If that email has an account, a reset link and a 6-digit code are on the way.",
};

function appOrigin() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://flowysign.com";
  return raw.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter the email on your account" }, { status: 400 });
  }

  const requested = body.data.email.trim().toLowerCase();
  const user = await findUserByEmail(requested);
  const registered = (user?.email || "").trim().toLowerCase();
  // No account, or the stored address is not the one they typed: send nothing.
  if (!user || registered !== requested) {
    return NextResponse.json(GENERIC);
  }

  const token = makeResetToken();
  const code = makeResetOtp();
  const otpHash = hashSecret(code);
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  let bound = false;

  await updateStore((store) => {
    const row = store.users.find((item) => item.id === user.id);
    if (!row || (row.email || "").trim().toLowerCase() !== registered) return;
    row.resetTokenHash = hashSecret(token);
    row.resetTokenExpires = resetTokenExpires;
    row.resetOtpHash = otpHash;
    row.resetOtpExpires = resetOtpExpires;
    row.resetOtpAttempts = 0;
    bound = true;
  });

  if (!bound) return NextResponse.json(GENERIC);

  const site = await getSiteSettings();
  const brand = site.brandName || "Flowy Sign - eSignature";
  const safeBrand = brand.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const link = `${appOrigin()}/reset-password?token=${token}`;
  await enqueuePasswordReset({
    userId: user.id,
    to: registered,
    otpHash,
    subject: `Reset your ${brand} password`,
    text: `Your reset code is ${code}. It works for 15 minutes.\n\nOr open this link (1 hour):\n${link}`,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
        <p>Reset your ${safeBrand} password.</p>
        <p style="margin:24px 0;font-size:32px;letter-spacing:0.28em;font-weight:700">${code}</p>
        <p>Enter this 6-digit code on the forgot-password page. It works for 15 minutes.</p>
        <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Choose a new password</a></p>
        <p style="color:#64748b;font-size:13px">Or copy this link. It works for 1 hour:<br/>${link}</p>
      </div>`,
  });

  await drainResetMailQueue(1);
  after(async () => {
    await drainResetMailQueue(3);
  });

  return NextResponse.json(GENERIC);
}
