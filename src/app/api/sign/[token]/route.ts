import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, updateStore } from "@/lib/store";
import type { Document, SignatureMark } from "@/lib/types";

function publicDoc(doc: Document, recipientId: string) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    status: doc.status,
    fileKind: doc.fileKind || "text",
    fileDataUrl: doc.fileDataUrl,
    fileName: doc.fileName,
    completedAt: doc.completedAt,
    fields: doc.fields.filter((f) => f.recipientId === recipientId),
    recipients: doc.recipients.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      status: r.status,
      signedAt: r.signedAt,
      token: "",
    })),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const store = await readStore();
  const doc = store.documents.find((d) => d.recipients.some((r) => r.token === token));
  if (!doc) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const recipient = doc.recipients.find((r) => r.token === token)!;
  if (doc.status === "draft" || doc.status === "void") {
    return NextResponse.json({ error: "Document is not available for signing" }, { status: 400 });
  }

  await updateStore((s) => {
    const d = s.documents.find((x) => x.id === doc.id);
    if (!d) return;
    if (d.status === "sent") d.status = "viewed";
    const r = d.recipients.find((x) => x.token === token);
    if (r && r.status === "pending") r.status = "viewed";
    d.updatedAt = new Date().toISOString();
  });

  const fresh = (await readStore()).documents.find((d) => d.id === doc.id)!;

  return NextResponse.json({
    document: publicDoc(fresh, recipient.id),
    recipient: {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      status: recipient.status === "pending" ? "viewed" : recipient.status,
      preferredSignatureStyle: recipient.preferredSignatureStyle || "elegant",
    },
    fullDocument: fresh.status === "completed" ? sanitizeDoc(fresh) : null,
  });
}

const markSchema = z.object({
  mode: z.enum(["typed", "image"]),
  text: z.string().optional(),
  style: z
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
  imageDataUrl: z.string().optional(),
});

const signSchema = z.object({
  signature: z.string().min(1),
  initials: z.string().optional(),
  signatureMark: markSchema.optional(),
});

function sanitizeDoc(doc: Document): Document {
  return {
    ...doc,
    recipients: doc.recipients.map((r) => ({ ...r, token: "" })),
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = signSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Signature required" }, { status: 400 });
  }

  const mark: SignatureMark | undefined = body.data.signatureMark
    ? {
        mode: body.data.signatureMark.mode,
        text: body.data.signatureMark.text || body.data.signature,
        style: body.data.signatureMark.style || "elegant",
        imageDataUrl: body.data.signatureMark.imageDataUrl,
      }
    : {
        mode: "typed",
        text: body.data.signature,
        style: "elegant",
      };

  if (mark.mode === "image" && !mark.imageDataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "Valid signature image required" }, { status: 400 });
  }
  if (mark.mode === "typed" && !(mark.text || "").trim()) {
    return NextResponse.json({ error: "Signature text required" }, { status: 400 });
  }

  let result: { ok: boolean; completed?: boolean; document?: Document } = { ok: false };

  await updateStore((store) => {
    const doc = store.documents.find((d) => d.recipients.some((r) => r.token === token));
    if (!doc) return;
    const recipient = doc.recipients.find((r) => r.token === token);
    if (!recipient) return;

    const now = new Date().toISOString();
    recipient.status = "signed";
    recipient.signedAt = now;

    const display = mark.mode === "typed" ? (mark.text || body.data.signature).trim() : mark.text || recipient.name;

    for (const field of doc.fields) {
      if (field.recipientId !== recipient.id) continue;
      if (field.type === "signature") {
        field.value = display;
        field.signature = { ...mark };
      }
      if (field.type === "initials") {
        field.value = body.data.initials || display.slice(0, 2).toUpperCase();
        field.signature = {
          mode: "typed",
          text: field.value,
          style: mark.style || "script",
        };
      }
      if (field.type === "date") field.value = new Date().toLocaleDateString();
      if (field.type === "text") field.value = field.value || display;
      field.signedAt = now;
    }

    // Original content / fileDataUrl intentionally untouched
    const allSigned = doc.recipients.every((r) => r.status === "signed");
    if (allSigned) {
      doc.status = "completed";
      doc.completedAt = now;
    }
    doc.updatedAt = now;
    result = { ok: true, completed: allSigned, document: sanitizeDoc({ ...doc }) };
  });

  if (!result.ok) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  return NextResponse.json(result);
}
