import mongoose, { Schema, models, model } from "mongoose";
import type { PlatformStore } from "@/lib/types";

export type PlatformDoc = {
  _id: mongoose.Types.ObjectId;
  key: string;
  data: PlatformStore;
  /** Optimistic concurrency token — bumped on every store write */
  rev: number;
  updatedAt: Date;
};

const PlatformSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    data: { type: Schema.Types.Mixed, required: true },
    rev: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

// Reuse compiled model when present; only add missing `rev` path (no delete/recompile).
const existing = models.Platform as mongoose.Model<PlatformDoc> | undefined;
if (existing && !existing.schema.path("rev")) {
  existing.schema.add({ rev: { type: Number, required: true, default: 0 } });
}

export const Platform = existing || model<PlatformDoc>("Platform", PlatformSchema);
