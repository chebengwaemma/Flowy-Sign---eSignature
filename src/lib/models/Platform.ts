import mongoose, { Schema, models, model } from "mongoose";
import type { PlatformStore } from "@/lib/types";

export type PlatformDoc = {
  _id: mongoose.Types.ObjectId;
  key: string;
  data: PlatformStore;
  updatedAt: Date;
};

const PlatformSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Platform = models.Platform || model<PlatformDoc>("Platform", PlatformSchema);
