import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { finalizeUpload, MAX_UPLOAD_BYTES, saveUploadChunk } from "@/lib/file-bin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const chunkSchema = z.object({
  uploadId: z.string().min(8).max(80),
  index: z.number().int().min(0).max(50),
  total: z.number().int().min(1).max(50),
  fileName: z.string().min(1).max(180),
  mime: z.string().min(3).max(120),
  data: z.string().min(1).max(4_000_000),
});

const finishSchema = z.object({
  uploadId: z.string().min(8).max(80),
  finalize: z.literal(true),
  total: z.number().int().min(1).max(50),
  fileName: z.string().min(1).max(180),
  mime: z.string().min(3).max(120),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const finished = finishSchema.safeParse(raw);
  if (finished.success) {
    try {
      const saved = await finalizeUpload({
        uploadId: finished.data.uploadId,
        ownerId: user.id,
        orgId: user.orgId,
        fileName: finished.data.fileName,
        mime: finished.data.mime,
        total: finished.data.total,
      });
      return NextResponse.json(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the file";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const chunk = chunkSchema.safeParse(raw);
  if (!chunk.success) {
    return NextResponse.json({ error: "Invalid upload chunk" }, { status: 400 });
  }
  if (chunk.data.index >= chunk.data.total) {
    return NextResponse.json({ error: "Invalid upload chunk" }, { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(chunk.data.data, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid upload chunk" }, { status: 400 });
  }
  if (!bytes.length || bytes.length > 2_600_000) {
    return NextResponse.json({ error: "Upload chunk is too large" }, { status: 400 });
  }
  if (bytes.length * chunk.data.total > MAX_UPLOAD_BYTES + 2_600_000) {
    return NextResponse.json({ error: "File is too large (max 80 MB)." }, { status: 400 });
  }

  try {
    await saveUploadChunk({
      uploadId: chunk.data.uploadId,
      index: chunk.data.index,
      ownerId: user.id,
      bytes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, index: chunk.data.index });
}
