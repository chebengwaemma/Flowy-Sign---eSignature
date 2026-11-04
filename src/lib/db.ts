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
  const cached = g.__flowyMongo!;
  const readyState = cached.conn?.connection?.readyState;
  // 1 = connected (mongoose ConnectionStates.connected)
  if (cached.conn && readyState === 1) return cached.conn;

  // Drop stale/disconnected handles so the next request can reconnect.
  if (cached.conn) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        // Keep marketing SSR under a couple seconds when Atlas is unreachable.
        serverSelectionTimeoutMS: 2_000,
        connectTimeoutMS: 2_000,
        socketTimeoutMS: 4_000,
        maxPoolSize: 3,
      })
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  return cached.promise;
}

export function mongoUri() {
  return MONGODB_URI;
}
