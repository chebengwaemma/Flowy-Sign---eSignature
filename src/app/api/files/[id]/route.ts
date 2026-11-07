import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { FILE_PART_BYTES, filePartCount, readStoredFile } from "@/lib/file-bin";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const memory = new Map<string, { at: number; mime: string; bytes: Buffer; orgId: string; ownerId: string }>();

async function load(fileId: string) {
  const hit = memory.get(fileId);
  if (hit && Date.now() - hit.at < 60_000) return hit;
  const file = await readStoredFile(fileId);
  if (!file) return null;
  const next = { at: Date.now(), ...file };
  memory.set(fileId, next);
  return next;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const sign = url.searchParams.get("sign") || "";
  const file = await load(id);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const user = await getSessionUser().catch(() => null);
  let allowed = Boolean(user && (user.id === file.ownerId || user.orgId === file.orgId));
  if (!allowed && sign) {
    const store = await readStore({ signToken: sign });
    allowed = store.documents.some((doc) => doc.fileId === id);
  }
  if (!allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const parts = filePartCount(file.bytes.length);
  if (url.searchParams.get("meta") === "1") {
    return NextResponse.json({ mime: file.mime, size: file.bytes.length, parts });
  }

  const part = Number(url.searchParams.get("part") || "0");
  if (!Number.isInteger(part) || part < 0 || part >= parts) {
    return NextResponse.json({ error: "Bad part" }, { status: 400 });
  }
  const start = part * FILE_PART_BYTES;
  const slice = file.bytes.subarray(start, start + FILE_PART_BYTES);
  return new NextResponse(new Uint8Array(slice), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
