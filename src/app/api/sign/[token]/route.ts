import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sendSigningCompleteEmail } from "@/lib/signing-email";
import {
  applyDateToField,
  applySignatureToField,
  canCompleteSigning,
  clearField,
  isSignatureLike,
  recipientFields,
  skipField,
  todayLabel,
} from "@/lib/sign-field-ops";
import { readStore, updateStore } from "@/lib/store";
import type { Document, SignatureField, SignatureMark } from "@/lib/types";

function publicDoc(doc: Document, recipientId: string) {
  const fields = Array.isArray(doc.fields) ? doc.fields : [];
  const recipients = Array.isArray(doc.recipients) ? doc.recipients : [];
  return {
    id: doc.id,
    title: doc.title || "Document",
    content: doc.content || "",
    status: doc.status,
    fileKind: doc.fileKind || "text",
    fileDataUrl: doc.fileDataUrl,
    fileName: doc.fileName,
    completedAt: doc.completedAt,
    fields: fields.filter((f) => f?.recipientId === recipientId),
    recipients: recipients.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      status: r.status,
      signedAt: r.signedAt,
      token: "",
    })),
  };
}

function sanitizeDoc(doc: Document): Document {
  return {
    ...doc,
    fields: Array.isArray(doc.fields) ? doc.fields : [],
    recipients: (Array.isArray(doc.recipients) ? doc.recipients : []).map((r) => ({
      ...r,
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
  const doc = store.documents.find((d) =>
    (d.recipients || []).some((r) => r.token === token),
  );
  if (!doc) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const recipient = (doc.recipients || []).find((r) => r.token === token);
  if (!recipient) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }
  if (doc.status === "draft" || doc.status === "void") {
    return NextResponse.json({ error: "Document is not available for signing" }, { status: 400 });
  }

  await updateStore((s) => {
    const d = s.documents.find((x) => x.id === doc.id);
    if (!d) return;
    if (d.status === "sent") d.status = "viewed";
    const r = (d.recipients || []).find((x) => x.token === token);
    if (r && r.status === "pending") r.status = "viewed";
    d.updatedAt = new Date().toISOString();
  });

  const fresh = (await readStore()).documents.find((d) => d.id === doc.id) || doc;

  return NextResponse.json({
    document: publicDoc(fresh, recipient.id),
    recipient: {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      status: recipient.status === "pending" ? "viewed" : recipient.status,
      preferredSignatureStyle: recipient.preferredSignatureStyle || "elegant",
    },
    canComplete: canCompleteSigning(fresh, recipient.id),
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

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("apply"),
    /** 1 = signature only (required flow), 2 = signature + date, 3 = date only */
    mode: z.enum(["signature", "signature_and_date", "date"]),
    fieldId: z.string().optional(),
    signatureMark: markSchema.optional(),
    value: z.string().optional(),
  }),
  z.object({
    action: z.literal("edit"),
    fieldId: z.string().min(1),
    value: z.string().optional(),
    signatureMark: markSchema.optional(),
  }),
  z.object({
    action: z.literal("delete"),
    fieldId: z.string().min(1),
  }),
  z.object({
    action: z.literal("skip"),
    fieldId: z.string().min(1),
  }),
  z.object({
    action: z.literal("complete"),
  }),
]);

function resolveMark(
  input: z.infer<typeof markSchema> | undefined,
  fallbackText: string,
): SignatureMark | null {
  if (!input) {
    const text = fallbackText.trim();
    if (!text) return null;
    return { mode: "typed", text, style: "elegant" };
  }
  if (input.mode === "image") {
    if (!input.imageDataUrl?.startsWith("data:image/")) return null;
    return {
      mode: "image",
      imageDataUrl: input.imageDataUrl,
      text: input.text || fallbackText,
      style: input.style || "elegant",
    };
  }
  const text = (input.text || fallbackText).trim();
  if (!text) return null;
  return { mode: "typed", text, style: input.style || "elegant" };
}

function findTarget(
  fields: Document["fields"],
  recipientId: string,
  type: "signature" | "date",
  fieldId?: string,
) {
  const mine = fields.filter((f) => f.recipientId === recipientId);
  if (fieldId) {
    const hit = mine.find((f) => f.id === fieldId);
    if (!hit) return null;
    if (type === "signature" && !isSignatureLike(hit)) return null;
    if (type === "date" && hit.type !== "date") return null;
    return hit;
  }
  if (type === "signature") {
    return (
      mine.find((f) => isSignatureLike(f) && !f.skipped && !f.value && !f.signature) ||
      mine.find((f) => isSignatureLike(f) && !f.skipped) ||
      null
    );
  }
  return (
    mine.find((f) => f.type === "date" && !f.skipped && !f.value) ||
    mine.find((f) => f.type === "date" && !f.skipped) ||
    null
  );
}

/** Real-time field sync — every place / edit / delete / skip writes Mongo immediately. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = patchSchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid field action" }, { status: 400 });
  }

  let result: {
    ok: boolean;
    error?: string;
    completed?: boolean;
    document?: ReturnType<typeof publicDoc>;
    canComplete?: boolean;
    fullDocument?: Document | null;
  } = { ok: false };

  await updateStore((store) => {
    const doc = store.documents.find((d) =>
      (Array.isArray(d.recipients) ? d.recipients : []).some((r) => r.token === token),
    );
    if (!doc) {
      result = { ok: false, error: "Invalid link" };
      return;
    }
    if (!Array.isArray(doc.recipients)) doc.recipients = [];
    if (!Array.isArray(doc.fields)) doc.fields = [];
    if (doc.status === "draft" || doc.status === "void") {
      result = { ok: false, error: "Document is not available for signing" };
      return;
    }

    const recipient = doc.recipients.find((r) => r.token === token);
    if (!recipient) {
      result = { ok: false, error: "Invalid link" };
      return;
    }
    if (recipient.status === "signed") {
      result = {
        ok: true,
        completed: doc.status === "completed",
        document: publicDoc(doc, recipient.id),
        canComplete: true,
        fullDocument: doc.status === "completed" ? sanitizeDoc(doc) : null,
      };
      return;
    }

    const op = body.data;
    const fallbackName = recipient.name || recipient.email || "Signed";

    if (op.action === "apply") {
      if (op.mode === "signature" || op.mode === "signature_and_date") {
        const mark = resolveMark(op.signatureMark, op.value || fallbackName);
        if (!mark) {
          result = { ok: false, error: "Signature required" };
          return;
        }
        const display =
          mark.mode === "typed"
            ? (mark.text || "").trim()
            : String(mark.text || fallbackName).trim();
        const target = findTarget(doc.fields, recipient.id, "signature", op.fieldId);
        if (!target) {
          result = { ok: false, error: "No signature field to fill" };
          return;
        }
        applySignatureToField(target, mark, display);
        if (op.mode === "signature_and_date") {
          const dates = recipientFields(doc, recipient.id).filter((f) => f.type === "date");
          if (dates.length === 0) {
            const companion: SignatureField = {
              id: `fld_${nanoid(10)}`,
              type: "date",
              page: target.page || 1,
              x: target.x,
              y: Math.min(94, target.y + (target.height || 8) + 1.5),
              width: Math.min(22, Math.max(14, target.width * 0.7)),
              height: 6,
              recipientId: recipient.id,
            };
            applyDateToField(companion, todayLabel());
            doc.fields.push(companion);
          } else {
            for (const field of dates) {
              if (!field.skipped) applyDateToField(field, todayLabel());
            }
          }
        }
      } else {
        const target = findTarget(doc.fields, recipient.id, "date", op.fieldId);
        if (!target) {
          result = { ok: false, error: "No date field to fill" };
          return;
        }
        applyDateToField(target, op.value || todayLabel());
      }
    } else if (op.action === "edit") {
      const field = doc.fields.find((f) => f.id === op.fieldId && f.recipientId === recipient.id);
      if (!field) {
        result = { ok: false, error: "Field not found" };
        return;
      }
      if (isSignatureLike(field)) {
        const mark = resolveMark(op.signatureMark, op.value || field.value || fallbackName);
        if (!mark) {
          result = { ok: false, error: "Signature required" };
          return;
        }
        const display =
          mark.mode === "typed"
            ? (mark.text || "").trim()
            : String(mark.text || fallbackName).trim();
        applySignatureToField(field, mark, display);
      } else {
        applyDateToField(field, op.value || field.value || todayLabel());
      }
    } else if (op.action === "delete") {
      const field = doc.fields.find((f) => f.id === op.fieldId && f.recipientId === recipient.id);
      if (!field) {
        result = { ok: false, error: "Field not found" };
        return;
      }
      clearField(field);
    } else if (op.action === "skip") {
      const field = doc.fields.find((f) => f.id === op.fieldId && f.recipientId === recipient.id);
      if (!field) {
        result = { ok: false, error: "Field not found" };
        return;
      }
      if (isSignatureLike(field)) {
        const others = recipientFields(doc, recipient.id).filter(
          (f) => isSignatureLike(f) && f.id !== field.id && !f.skipped,
        );
        const someoneFilled = others.some((f) => f.value || f.signature);
        const someoneOpen = others.some((f) => !f.value && !f.signature);
        if (!someoneFilled && !someoneOpen) {
          result = {
            ok: false,
            error: "At least one signature is required — cannot skip the only signature field",
          };
          return;
        }
      }
      skipField(field);
    } else if (op.action === "complete") {
      if (!canCompleteSigning(doc, recipient.id)) {
        result = {
          ok: false,
          error: "Place a required signature before finishing",
          document: publicDoc(doc, recipient.id),
          canComplete: false,
        };
        return;
      }
      const now = new Date().toISOString();
      recipient.status = "signed";
      recipient.signedAt = now;
      const allSigned = doc.recipients.every((r) => r.status === "signed");
      if (allSigned) {
        doc.status = "completed";
        doc.completedAt = now;
      }
      doc.updatedAt = now;
      result = {
        ok: true,
        completed: allSigned,
        document: publicDoc(doc, recipient.id),
        canComplete: true,
        fullDocument: allSigned ? sanitizeDoc({ ...doc }) : null,
      };
      return;
    }

    doc.updatedAt = new Date().toISOString();
    result = {
      ok: true,
      document: publicDoc(doc, recipient.id),
      canComplete: canCompleteSigning(doc, recipient.id),
      completed: false,
      fullDocument: null,
    };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Could not update", document: result.document, canComplete: result.canComplete },
      { status: result.error?.includes("required") ? 400 : 404 },
    );
  }

  if (result.completed && result.fullDocument) {
    try {
      const store = await readStore();
      const owner = store.users.find((u) => u.id === result.fullDocument!.ownerId);
      if (owner?.email) {
        await sendSigningCompleteEmail(owner, result.fullDocument);
      }
    } catch (err) {
      console.warn("[sign] completion email failed", (err as Error).message);
    }
  }

  return NextResponse.json(result);
}

const signSchema = z.object({
  signature: z.string().min(1),
  initials: z.string().optional(),
  signatureMark: markSchema.optional(),
});

/** Legacy one-shot adopt & sign — still supported; also stamps dates. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = signSchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Signature required" }, { status: 400 });
  }

  const mark = resolveMark(
    body.data.signatureMark,
    body.data.signature,
  );
  if (!mark) {
    return NextResponse.json({ error: "Signature required" }, { status: 400 });
  }

  let result: { ok: boolean; completed?: boolean; document?: Document } = { ok: false };

  await updateStore((store) => {
    const doc = store.documents.find((d) =>
      (Array.isArray(d.recipients) ? d.recipients : []).some((r) => r.token === token),
    );
    if (!doc) return;
    if (!Array.isArray(doc.recipients)) doc.recipients = [];
    if (!Array.isArray(doc.fields)) doc.fields = [];

    const recipient = doc.recipients.find((r) => r.token === token);
    if (!recipient) return;

    const now = new Date().toISOString();
    const display =
      mark.mode === "typed"
        ? (mark.text || body.data.signature || "").trim()
        : String(mark.text || recipient.name || recipient.email || "Signed").trim();

    for (const field of doc.fields) {
      if (field.recipientId !== recipient.id) continue;
      if (isSignatureLike(field)) {
        applySignatureToField(field, mark, display, body.data.initials);
      } else if (field.type === "date") {
        applyDateToField(field);
      } else if (field.type === "text") {
        field.value = field.value || display;
        field.signedAt = now;
        field.skipped = false;
      }
    }

    if (!canCompleteSigning(doc, recipient.id)) {
      result = { ok: false };
      return;
    }

    recipient.status = "signed";
    recipient.signedAt = now;
    const allSigned = doc.recipients.every((r) => r.status === "signed");
    if (allSigned) {
      doc.status = "completed";
      doc.completedAt = now;
    }
    doc.updatedAt = now;
    result = { ok: true, completed: allSigned, document: sanitizeDoc({ ...doc }) };
  });

  if (!result.ok) return NextResponse.json({ error: "Invalid link or signature missing" }, { status: 404 });

  if (result.completed && result.document) {
    try {
      const store = await readStore();
      const owner = store.users.find((u) => u.id === result.document!.ownerId);
      if (owner?.email) {
        await sendSigningCompleteEmail(owner, result.document);
      }
    } catch (err) {
      console.warn("[sign] completion email failed", (err as Error).message);
    }
  }

  return NextResponse.json(result);
}
