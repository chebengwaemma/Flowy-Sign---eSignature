import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }

  const resetTokenHash = createHash("sha256").update(body.data.token).digest("hex");
  let updated = false;
  await updateStore((store) => {
    const user = store.users.find((u) => u.resetTokenHash === resetTokenHash);
    if (!user?.resetTokenExpires) return;
    if (Date.parse(user.resetTokenExpires) < Date.now()) return;
    user.password = body.data.password;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
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
