import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSignatureQuota, isBillableSignatureDoc, quotaBlockedResponse } from "@/lib/plan-usage";
import { readStore, updateStore } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const store = await readStore();
  const doc = store.documents.find((d) => d.id === id && d.orgId === user.orgId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const store = await readStore();
  const existing = store.documents.find((d) => d.id === id && d.orgId === user.orgId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const becomingSent =
    body.status === "sent" && !isBillableSignatureDoc(existing.status);
  if (becomingSent) {
    const quota = await getSignatureQuota(user);
    if (!quota.allowed) {
      return NextResponse.json(quotaBlockedResponse(quota), { status: 402 });
    }
  }

  let updated = null;
  await updateStore((s) => {
    const doc = s.documents.find((d) => d.id === id && d.orgId === user.orgId);
    if (!doc) return;
    if (body.status === "sent") doc.status = "sent";
    if (body.status === "void") doc.status = "void";
    if (typeof body.title === "string") doc.title = body.title;
    doc.updatedAt = new Date().toISOString();
    updated = doc;
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: updated });
}
