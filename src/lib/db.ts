import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flowysign";

type GlobalMongo = typeof globalThis & {
  __flowyMongo?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const g = globalThis as GlobalMongo;

if (!g.__flowyMongo) {
  g.__flowyMongo = { conn: null, promise: null };
}

export async function connectDB() {
  if (g.__flowyMongo!.conn) return g.__flowyMongo!.conn;

  if (!g.__flowyMongo!.promise) {
    g.__flowyMongo!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Fail fast instead of hanging the whole site when Atlas is busy.
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      socketTimeoutMS: 20_000,
      maxPoolSize: 5,
    });
  }

  g.__flowyMongo!.conn = await g.__flowyMongo!.promise;
  return g.__flowyMongo!.conn;
}

export function mongoUri() {
  return MONGODB_URI;
}
