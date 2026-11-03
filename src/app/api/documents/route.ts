import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getSignatureQuota, quotaBlockedResponse } from "@/lib/plan-usage";
import { getOrgDocuments, updateStore } from "@/lib/store";
import type { Document, Recipient, SignatureField } from "@/lib/types";

const createSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  fileKind: z.enum(["text", "image", "pdf"]).optional(),
  fileDataUrl: z.string().optional(),
  fileName: z.string().optional(),
  recipients: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        preferredSignatureStyle: z
          .enum([
            "elegant",
            "script",
            "formal",
            "casual",
            "marker",
            "classic",
            "bold",
            "italic",
            "slant",
            "strike",
          ])
          .optional(),
      }),
    )
    .min(1),
  fields: z
    .array(
      z.object({
        type: z.enum(["signature", "initials", "date", "text"]),
        signerIndex: z.number().int().min(0),
        x: z.number(),
        y: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .optional(),
  send: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const docs = await getOrgDocuments(user.orgId);
  return NextResponse.json({ documents: docs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
  }

  const fileKind = body.data.fileKind || "text";
  if (fileKind === "text" && body.data.content.trim().length < 10) {
    return NextResponse.json({ error: "Document content too short" }, { status: 400 });
  }
  if ((fileKind === "image" || fileKind === "pdf") && !body.data.fileDataUrl) {
    return NextResponse.json({ error: "File data required" }, { status: 400 });
  }
  if (body.data.fileDataUrl && body.data.fileDataUrl.length > 6_000_000) {
    return NextResponse.json({ error: "File too large (max ~4MB)" }, { status: 400 });
  }

  if (body.data.send) {
    const quota = await getSignatureQuota(user);
    if (!quota.allowed) {
      return NextResponse.json(quotaBlockedResponse(quota), { status: 402 });
    }
  }

  const now = new Date().toISOString();
  const recipients: Recipient[] = body.data.recipients.map((r) => ({
    id: nanoid(8),
    name: r.name,
    email: r.email,
    status: "pending",
    token: `sign_${nanoid(16)}`,
    preferredSignatureStyle: r.preferredSignatureStyle || "elegant",
  }));

  let fields: SignatureField[];
  if (body.data.fields?.length) {
    fields = body.data.fields
      .map((f) => {
        const recipient = recipients[f.signerIndex];
        if (!recipient) return null;
        return {
          id: nanoid(8),
          type: f.type,
          page: 1,
          x: f.x,
          y: f.y,
          width: f.width ?? (f.type === "signature" ? 28 : 18),
          height: f.height ?? (f.type === "signature" ? 10 : 6),
          recipientId: recipient.id,
        } satisfies SignatureField;
      })
      .filter(Boolean) as SignatureField[];
  } else {
    fields = recipients.flatMap((r, index) => [
      {
        id: nanoid(8),
        type: "signature" as const,
        page: 1,
        x: 12,
        y: 68 + index * 10,
        width: 28,
        height: 10,
        recipientId: r.id,
      },
      {
        id: nanoid(8),
        type: "date" as const,
        page: 1,
        x: 48,
        y: 68 + index * 10,
        width: 18,
        height: 6,
        recipientId: r.id,
      },
    ]);
  }

  if (!fields.some((f) => f.type === "signature")) {
    return NextResponse.json({ error: "Place at least one signature field" }, { status: 400 });
  }

  const doc: Document = {
    id: `doc_${nanoid(10)}`,
    orgId: user.orgId,
    ownerId: user.id,
    title: body.data.title,
    status: body.data.send ? "sent" : "draft",
    content: body.data.content,
    fileKind,
    fileDataUrl: body.data.fileDataUrl,
    fileName: body.data.fileName,
    fields,
    recipients,
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((store) => {
    store.documents.unshift(doc);
  });

  return NextResponse.json({ document: doc });
}
