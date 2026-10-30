import mongoose, { Schema, models, model } from "mongoose";

export type AdminDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin";
  createdAt: Date;
  updatedAt: Date;
};

const AdminSchema = new Schema<AdminDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin"], default: "admin" },
  },
  { timestamps: true },
);

export const Admin = models.Admin || model<AdminDoc>("Admin", AdminSchema);
