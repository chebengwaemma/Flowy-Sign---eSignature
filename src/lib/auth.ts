import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import {
  checkSessionCapacity,
  registerDeviceSession,
  revokeSession,
  sessionIsActive,
  type ActiveSessionView,
} from "./device-sessions";
import { findUserById } from "./store";
import type { User } from "./types";

const COOKIE = "flowy_session";
/** Long-lived sessions — no aggressive auto-timeout once logged in */
const SESSION_TTL = "365d";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

/** Keep the last good profile in this isolate so a Mongo blip does not look like logout. */
const sessionUserCache = new Map<string, User>();

export class SessionStoreUnavailable extends Error {
  constructor() {
    super("SESSION_STORE_UNAVAILABLE");
    this.name = "SessionStoreUnavailable";
  }
}

function isStoreOutage(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return /database unavailable|mongo|timed out|temporarily skipped|network access/i.test(message);
}

function secret() {
  const value = process.env.AUTH_SECRET || "flowy-sign-dev-secret-change-in-production";
  return new TextEncoder().encode(value);
}

export type SessionLimitPayload = {
  ok: false;
  code: "SESSION_LIMIT_REACHED";
  error: string;
  max_sessions: number;
  active_sessions: ActiveSessionView[];
  pending_login_token: string;
};

export type SessionOk = { ok: true };

export async function createPendingLoginToken(userId: string, deviceLabel: string) {
  return new SignJWT({ sub: userId, deviceLabel, purpose: "pending_login" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .setJti(nanoid(16))
    .sign(secret());
}

export async function verifyPendingLoginToken(token: string): Promise<{
  userId: string;
  deviceLabel: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "pending_login" || !payload.sub) return null;
    return {
      userId: payload.sub,
      deviceLabel: typeof payload.deviceLabel === "string" ? payload.deviceLabel : "Unknown device",
    };
  } catch {
    return null;
  }
}

async function issueSessionCookie(userId: string, jti: string) {
  const token = await new SignJWT({ sub: userId, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .setJti(jti)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Create session if under device limit; otherwise return limit payload (no cookie). */
export async function tryCreateSession(
  userId: string,
  deviceLabel = "Unknown device",
): Promise<SessionOk | SessionLimitPayload> {
  const user = await findUserById(userId);
  if (!user) {
    return {
      ok: false,
      code: "SESSION_LIMIT_REACHED",
      error: "User not found",
      max_sessions: 0,
      active_sessions: [],
      pending_login_token: "",
    };
  }

  const gate = await checkSessionCapacity(user);
  if (!gate.allowed) {
    const pending_login_token = await createPendingLoginToken(userId, deviceLabel);
    return {
      ok: false,
      code: "SESSION_LIMIT_REACHED",
      error: `You can stay signed in on up to ${gate.max_sessions} devices. End one session to continue.`,
      max_sessions: gate.max_sessions,
      active_sessions: gate.active_sessions,
      pending_login_token,
    };
  }

  const jti = nanoid(18);
  await registerDeviceSession({ userId, sessionId: jti, deviceLabel });
  await issueSessionCookie(userId, jti);
  return { ok: true };
}

/** @deprecated prefer tryCreateSession — kept for call sites that ignore limits */
export async function createSession(userId: string, deviceLabel = "Unknown device") {
  const result = await tryCreateSession(userId, deviceLabel);
  if (!result.ok) {
    throw Object.assign(new Error(result.error), { sessionLimit: result });
  }
}

export async function replaceSessionAndLogin(
  pendingLoginToken: string,
  terminateSessionId: string,
): Promise<(SessionOk & { userId: string }) | { ok: false; error: string }> {
  const pending = await verifyPendingLoginToken(pendingLoginToken);
  if (!pending) return { ok: false, error: "Pending login expired — sign in again" };

  const revoked = await revokeSession(pending.userId, terminateSessionId);
  if (!revoked) return { ok: false, error: "That session is no longer active" };

  const created = await tryCreateSession(pending.userId, pending.deviceLabel);
  if (!created.ok) return { ok: false, error: created.error };
  return { ok: true, userId: pending.userId };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      const jti = (payload.jti || (payload as { jti?: string }).jti) as string | undefined;
      if (payload.sub && jti) await revokeSession(payload.sub, jti);
    } catch {
      /* ignore */
    }
  }
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const jti = typeof payload.jti === "string" ? payload.jti : undefined;

    // Legacy cookies without jti remain valid until they expire.
    // A database blip must not look like logout — only a real revoke does.
    if (jti) {
      try {
        const active = await sessionIsActive(payload.sub, jti);
        if (!active) return null;
      } catch (err) {
        if (!isStoreOutage(err)) return null;
      }
    }

    try {
      const user = await findUserById(payload.sub);
      if (!user) return null;
      sessionUserCache.set(user.id, user);
      return user;
    } catch (err) {
      if (!isStoreOutage(err)) return null;
      const cached = sessionUserCache.get(payload.sub);
      if (cached) return cached;
      throw new SessionStoreUnavailable();
    }
  } catch (err) {
    if (err instanceof SessionStoreUnavailable) throw err;
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function publicUser(user: User) {
  const { password: _password, ...safe } = user;
  return safe;
}
