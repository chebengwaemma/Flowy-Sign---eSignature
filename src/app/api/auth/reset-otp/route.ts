import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordIssue } from "@/lib/password-policy";
import { secretsMatch } from "@/lib/password-reset";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(1),
});

const INVALID = "That code is invalid or expired. Request a new one.";

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }
  const weakPassword = passwordIssue(body.data.password);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }

  const email = body.data.email.trim().toLowerCase();
  const code = body.data.code;
  const state = { ok: false };

  await updateStore((store) => {
    const user = store.users.find(
      (u) => (u.email || "").trim().toLowerCase() === email && u.id && u.resetOtpHash,
    );
    if (!user?.resetOtpHash || !user.resetOtpExpires) return;
    if (Date.parse(user.resetOtpExpires) < Date.now() || (user.resetOtpAttempts || 0) >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      return;
    }
    if (!secretsMatch(user.resetOtpHash, code)) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      if ((user.resetOtpAttempts || 0) >= 5) {
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
      }
      return;
    }
    user.password = body.data.password;
    user.mustChangePassword = false;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    state.ok = true;
  });

  if (!state.ok) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
