import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flowysign";

/**
 * Do not blacklist Mongo after one slow call. A 30s skip turned a single Atlas
 * hiccup into "sign in / sign up is broken" for every request on that instance.
 */
const SKIP_AFTER_FAIL_MS = 0;

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
        // Vercel bom1 → Atlas often needs more than a couple of seconds on a cold connect.
        serverSelectionTimeoutMS: 8_000,
        connectTimeoutMS: 8_000,
        socketTimeoutMS: 20_000,
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
