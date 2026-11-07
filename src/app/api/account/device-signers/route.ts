import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/get-marketing";
import { lockDeviceSigners, type DeviceSignerSlot } from "@/lib/packages";
import { updateStore } from "@/lib/store";

const bodySchema = z.object({
  signers: z
    .array(z.object({ name: z.string(), email: z.string() }))
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid emails" }, { status: 400 });
  }

  const settings = await getSiteSettings();
  const preview = lockDeviceSigners(user, body.data.signers, settings);
  if (!preview.ok) return NextResponse.json({ error: preview.error }, { status: 400 });

  let saved: DeviceSignerSlot[] | null = null;
  let error = "";
  await updateStore((store) => {
    const target = store.users.find((u) => u.id === user.id);
    if (!target) {
      error = "Account not found.";
      return;
    }
    const verdict = lockDeviceSigners(target, body.data.signers, settings);
    if (!verdict.ok) {
      error = verdict.error;
      return;
    }
    target.deviceSigners = verdict.signers;
    saved = verdict.signers;
  });

  if (!saved) {
    return NextResponse.json({ error: error || "Could not lock device emails." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, locked: true, signers: saved });
}
