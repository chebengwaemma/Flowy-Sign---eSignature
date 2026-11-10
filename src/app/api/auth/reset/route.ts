import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordIssue } from "@/lib/password-policy";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "That reset link is not valid." }, { status: 400 });
  }
  const weakPassword = passwordIssue(body.data.password);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }

  const resetTokenHash = createHash("sha256").update(body.data.token).digest("hex");
  let updated = false;
  await updateStore((store) => {
    const user = store.users.find((u) => u.resetTokenHash === resetTokenHash);
    if (!user?.resetTokenExpires) return;
    if (Date.parse(user.resetTokenExpires) < Date.now()) return;
    user.password = body.data.password;
    user.mustChangePassword = false;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    updated = true;
  });

  if (!updated) {
    return NextResponse.json(
      { error: "This reset link is invalid or expired. Request a new one." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
