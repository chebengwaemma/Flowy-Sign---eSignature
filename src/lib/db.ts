import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flowysign";

/** After a failed connect, skip Mongo briefly so warm SSR does not pay the timeout every hit. */
const SKIP_AFTER_FAIL_MS = 45_000;

type GlobalMongo = typeof globalThis & {
  __flowyMongo?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    skipUntil: number;
  };
};

const g = globalThis as GlobalMongo;

if (!g.__flowyMongo) {
  g.__flowyMongo = { conn: null, promise: null, skipUntil: 0 };
}

export async function connectDB() {
  const cached = g.__flowyMongo!;
  const readyState = cached.conn?.connection?.readyState;
  // 1 = connected (mongoose ConnectionStates.connected)
  if (cached.conn && readyState === 1) return cached.conn;

  if (Date.now() < cached.skipUntil) {
    throw new Error("Mongo temporarily skipped after recent failure");
  }

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
        // Vercel → Atlas often stalls on IPv6; prefer IPv4.
        family: 4,
      })
      .then((conn) => {
        cached.conn = conn;
        cached.skipUntil = 0;
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        cached.skipUntil = Date.now() + SKIP_AFTER_FAIL_MS;
        throw err;
      });
  }

  return cached.promise;
}

export function mongoUri() {
  return MONGODB_URI;
}

/** Mark Mongo unhealthy so subsequent reads in this isolate fail over instantly. */
export function markMongoUnreachable() {
  const cached = g.__flowyMongo!;
  cached.skipUntil = Date.now() + SKIP_AFTER_FAIL_MS;
  cached.promise = null;
  cached.conn = null;
}
