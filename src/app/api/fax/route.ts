import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { faxLimit } from "@/lib/plan-limits";
import { mergeSettings } from "@/lib/settings";
import { getOrgFaxes, readStore, updateStore } from "@/lib/store";
import type { FaxMessage } from "@/lib/types";

const schema = z.object({
  toNumber: z.string().min(7),
  subject: z.string().min(2),
  pages: z.number().int().min(1).max(50).default(1),
});

export const dynamic = "force-dynamic";

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
  const site = mergeSettings(store.site);
  if (!site.faxEnabled) {
    return NextResponse.json({ error: "Fax is disabled for this workspace" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = schema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid fax payload" }, { status: 400 });
  }

  const limit = faxLimit(user.plan || "free", site);
  if (limit === 0) {
    return NextResponse.json(
      { error: "Your plan does not include fax. Upgrade to send faxes.", code: "FAX_LIMIT" },
      { status: 403 },
    );
  }
  if (limit > 0) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const used = (store.faxes || []).filter(
      (f) =>
        f.orgId === user.orgId &&
        f.direction === "outbound" &&
        f.createdAt &&
        new Date(f.createdAt).getTime() >= monthStart.getTime(),
    ).length;
    if (used >= limit) {
      return NextResponse.json(
        {
          error: `Monthly fax limit reached (${limit}). Upgrade your plan for more.`,
          code: "FAX_LIMIT",
        },
        { status: 403 },
      );
    }
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
