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

// Hot-reload can keep a stale compiled model without `rev` — force refresh.
if (models.Platform) {
  delete models.Platform;
}

export const Platform = model<PlatformDoc>("Platform", PlatformSchema);
