import { Binary, GridFSBucket, ObjectId } from "mongodb";
import mongoose from "mongoose";
import { connectDB } from "./db";

const CHUNKS = "flowy_upload_chunks";
const BUCKET = "flowyFiles";

/** Contracts of 10–20 pages. Each upload request stays under the host body limit. */
export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
export const FILE_PART_BYTES = 3 * 1024 * 1024;

type StoredMeta = { mime?: string; orgId?: string; ownerId?: string };

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (data instanceof Binary) return Buffer.from(data.value());
  throw new Error("Bad upload chunk");
}

async function database() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database unavailable");
  return db;
}

export async function saveUploadChunk(input: {
  uploadId: string;
  index: number;
  ownerId: string;
  bytes: Buffer;
}) {
  const db = await database();
  await db.collection(CHUNKS).updateOne(
    { uploadId: input.uploadId, index: input.index },
    {
      $set: {
        ownerId: input.ownerId,
        data: input.bytes,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function finalizeUpload(input: {
  uploadId: string;
  ownerId: string;
  orgId: string;
  fileName: string;
  mime: string;
  total: number;
}): Promise<{ fileId: string; size: number }> {
  const db = await database();
  const col = db.collection(CHUNKS);
  const parts = await col
    .find({ uploadId: input.uploadId, ownerId: input.ownerId })
    .sort({ index: 1 })
    .toArray();
  if (parts.length !== input.total) {
    throw new Error("Upload incomplete. Try the file again.");
  }
  const buffers = parts.map((part) => toBuffer(part.data));
  const size = buffers.reduce((sum, buf) => sum + buf.length, 0);
  if (!size || size > MAX_UPLOAD_BYTES) {
    await col.deleteMany({ uploadId: input.uploadId });
    throw new Error("File is too large (max 80 MB).");
  }

  const bucket = new GridFSBucket(db, { bucketName: BUCKET });
  const id = new ObjectId();
  await new Promise<void>((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, input.fileName || "document", {
      metadata: {
        ownerId: input.ownerId,
        orgId: input.orgId,
        mime: input.mime || "application/octet-stream",
      },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve());
    for (const buf of buffers) stream.write(buf);
    stream.end();
  });
  await col.deleteMany({ uploadId: input.uploadId });
  return { fileId: id.toString(), size };
}

export async function readStoredFile(fileId: string): Promise<{
  mime: string;
  bytes: Buffer;
  orgId: string;
  ownerId: string;
} | null> {
  if (!ObjectId.isValid(fileId)) return null;
  const db = await database();
  const bucket = new GridFSBucket(db, { bucketName: BUCKET });
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  const file = files[0];
  if (!file) return null;
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = bucket.openDownloadStream(file._id);
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });
  const meta = (file.metadata || {}) as StoredMeta;
  return {
    mime: meta.mime || "application/octet-stream",
    bytes: Buffer.concat(chunks),
    orgId: meta.orgId || "",
    ownerId: meta.ownerId || "",
  };
}

export function filePartCount(size: number) {
  return Math.max(1, Math.ceil(size / FILE_PART_BYTES));
}
