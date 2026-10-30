import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getOrgFaxes, readStore, updateStore } from "@/lib/store";
import type { FaxMessage } from "@/lib/types";

const schema = z.object({
  toNumber: z.string().min(7),
  subject: z.string().min(2),
  pages: z.number().int().min(1).max(50).default(1),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const faxes = await getOrgFaxes(user.orgId);
  return NextResponse.json({ faxes });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await readStore();
  const org = store.organizations.find((o) => o.id === user.orgId);
  if (!(org?.settings.faxEnabled ?? store.site.faxEnabled)) {
    return NextResponse.json({ error: "Fax is disabled for this workspace" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid fax payload" }, { status: 400 });
  }

  const fax: FaxMessage = {
    id: `fax_${nanoid(10)}`,
    orgId: user.orgId,
    userId: user.id,
    direction: "outbound",
    toNumber: body.data.toNumber,
    fromNumber: "+1 (555) 010-1000",
    subject: body.data.subject,
    pages: body.data.pages,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  await updateStore((s) => {
    s.faxes.unshift(fax);
  });

  // Simulate carrier progression
  setTimeout(async () => {
    await updateStore((s) => {
      const item = s.faxes.find((f) => f.id === fax.id);
      if (item) item.status = "sending";
    });
    setTimeout(async () => {
      await updateStore((s) => {
        const item = s.faxes.find((f) => f.id === fax.id);
        if (item) item.status = "delivered";
      });
    }, 2500);
  }, 1200);

  return NextResponse.json({ fax });
}
