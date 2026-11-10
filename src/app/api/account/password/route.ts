import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { passwordIssue } from "@/lib/password-policy";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter your current password and a new one." }, { status: 400 });
  }
  const weakPassword = passwordIssue(body.data.newPassword);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }
  if (body.data.newPassword === body.data.currentPassword) {
    return NextResponse.json({ error: "Choose a password that is different from the temporary one." }, { status: 400 });
  }

  let updated = false;
  await updateStore((store) => {
    const user = store.users.find((u) => u.id === sessionUser.id);
    if (!user || user.password !== body.data.currentPassword) return;
    user.password = body.data.newPassword;
    user.mustChangePassword = false;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    updated = true;
  });

  if (!updated) {
    return NextResponse.json({ error: "The current password does not match." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
