import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flowysign";

/** After a failed connect, skip Mongo briefly so warm SSR does not pay the timeout every hit. */
const SKIP_AFTER_FAIL_MS = 30_000;

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
        // Fail fast on Vercel cold starts so pages don't sit ~10s on a blocked Atlas IP.
        serverSelectionTimeoutMS: 2_500,
        connectTimeoutMS: 2_500,
        socketTimeoutMS: 8_000,
        maxPoolSize: 5,
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

export function isMongoRequired() {
  return Boolean(process.env.VERCEL || process.env.MONGODB_URI);
}

/** True when this isolate is avoiding Mongo after a recent failure. */
export function isMongoSkipped() {
  return Date.now() < (g.__flowyMongo?.skipUntil || 0);
}
