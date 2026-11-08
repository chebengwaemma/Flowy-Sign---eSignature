import { NextResponse } from "next/server";
import { drainResetMailQueue } from "@/lib/reset-mail";

export const dynamic = "force-dynamic";

/** Retries a reset mail Resend already refused. Does not create a new code. */
export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  await drainResetMailQueue(8);
  return NextResponse.json({ ok: true });
}
