import { NextResponse } from "next/server";
import { z } from "zod";
import { publicUser, replaceSessionAndLogin } from "@/lib/auth";
import { findUserById } from "@/lib/store";

const schema = z.object({
  pending_login_token: z.string().min(10),
  terminate_session_id: z.string().min(4),
});

/** End one active device session, then complete the pending login. */
export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid replace payload" }, { status: 400 });
  }

  const result = await replaceSessionAndLogin(
    body.data.pending_login_token,
    body.data.terminate_session_id,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Could not replace session" }, { status: 400 });
  }

  const user = await findUserById(result.userId);
  return NextResponse.json({ ok: true, user: user ? publicUser(user) : undefined });
}
