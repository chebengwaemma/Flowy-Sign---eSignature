import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { makeTemporaryPassword } from "@/lib/password-reset";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const temporaryPassword = makeTemporaryPassword();
  let email = "";
  await updateStore((store) => {
    const user = store.users.find((u) => u.id === body.data.userId);
    if (!user) return;
    user.password = temporaryPassword;
    user.mustChangePassword = true;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    email = user.email;
  });

  if (!email) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true, email, temporaryPassword });
}
