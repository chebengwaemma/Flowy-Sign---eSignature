import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { publishLiveSite } from "@/lib/live-site";
import { bumpSiteRevision, readStore, updateStore } from "@/lib/store";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({ documents: store.documents });
}

const schema = z.object({
  documentId: z.string(),
  status: z.enum(["draft", "sent", "viewed", "completed", "void"]).optional(),
  title: z.string().optional(),
  delete: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let result = null;
  await updateStore((store) => {
    if (body.data.delete) {
      store.documents = store.documents.filter((d) => d.id !== body.data.documentId);
      result = { deleted: true };
      bumpSiteRevision(store);
      return;
    }
    const doc = store.documents.find((d) => d.id === body.data.documentId);
    if (!doc) return;
    if (body.data.status) doc.status = body.data.status;
    if (body.data.title) doc.title = body.data.title;
    doc.updatedAt = new Date().toISOString();
    result = doc;
    bumpSiteRevision(store);
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  publishLiveSite();
  return NextResponse.json({ document: result });
}
