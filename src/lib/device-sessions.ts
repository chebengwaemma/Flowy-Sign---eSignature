import { nanoid } from "nanoid";
import { effectiveMaxSessions } from "./packages";
import { updateStore, findUserById } from "./store";
import type { DeviceSession, User } from "./types";

export type ActiveSessionView = {
  session_id: string;
  device_label: string;
  last_seen_at: string;
  created_at: string;
};

export function deviceLabelFromRequest(req?: Request | null): string {
  const ua = req?.headers.get("user-agent") || "Unknown device";
  const short = ua.slice(0, 80);
  if (/Edg\//i.test(ua)) return `Edge · ${osHint(ua)}`;
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return `Chrome · ${osHint(ua)}`;
  if (/Firefox\//i.test(ua)) return `Firefox · ${osHint(ua)}`;
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return `Safari · ${osHint(ua)}`;
  return short || "Unknown device";
}

function osHint(ua: string) {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Device";
}

export async function listActiveSessions(userId: string): Promise<DeviceSession[]> {
  const { readStore } = await import("./store");
  const store = await readStore();
  return (store.deviceSessions || [])
    .filter((s) => s.userId === userId && !s.revokedAt)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export async function recountActiveDevices(userId: string): Promise<number> {
  let count = 0;
  await updateStore((store) => {
    if (!store.deviceSessions) store.deviceSessions = [];
    count = store.deviceSessions.filter((s) => s.userId === userId && !s.revokedAt).length;
    const user = store.users.find((u) => u.id === userId);
    if (user) user.activeDevicesCount = count;
  });
  return count;
}

export async function registerDeviceSession(input: {
  userId: string;
  sessionId: string;
  deviceLabel: string;
}): Promise<DeviceSession> {
  const now = new Date().toISOString();
  const row: DeviceSession = {
    id: nanoid(12),
    userId: input.userId,
    sessionId: input.sessionId,
    deviceLabel: input.deviceLabel || "Unknown device",
    createdAt: now,
    lastSeenAt: now,
  };
  await updateStore((store) => {
    if (!store.deviceSessions) store.deviceSessions = [];
    store.deviceSessions.push(row);
    const user = store.users.find((u) => u.id === input.userId);
    if (user) {
      user.activeDevicesCount = store.deviceSessions.filter(
        (s) => s.userId === input.userId && !s.revokedAt,
      ).length;
    }
  });
  return row;
}

export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  let found = false;
  const now = new Date().toISOString();
  await updateStore((store) => {
    if (!store.deviceSessions) store.deviceSessions = [];
    const row = store.deviceSessions.find(
      (s) => s.userId === userId && s.sessionId === sessionId && !s.revokedAt,
    );
    if (!row) return;
    row.revokedAt = now;
    found = true;
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.activeDevicesCount = store.deviceSessions.filter(
        (s) => s.userId === userId && !s.revokedAt,
      ).length;
    }
  });
  return found;
}

export async function touchSession(userId: string, sessionId: string): Promise<boolean> {
  let ok = false;
  const now = new Date().toISOString();
  await updateStore((store) => {
    if (!store.deviceSessions) store.deviceSessions = [];
    const row = store.deviceSessions.find(
      (s) => s.userId === userId && s.sessionId === sessionId && !s.revokedAt,
    );
    if (!row) return;
    row.lastSeenAt = now;
    ok = true;
  });
  return ok;
}

export async function sessionIsActive(userId: string, sessionId: string): Promise<boolean> {
  const active = await listActiveSessions(userId);
  return active.some((s) => s.sessionId === sessionId);
}

export function toSessionViews(sessions: DeviceSession[]): ActiveSessionView[] {
  return sessions.map((s) => ({
    session_id: s.sessionId,
    device_label: s.deviceLabel,
    last_seen_at: s.lastSeenAt,
    created_at: s.createdAt,
  }));
}

export type SessionGateResult =
  | { allowed: true }
  | {
      allowed: false;
      max_sessions: number;
      active_sessions: ActiveSessionView[];
    };

export async function checkSessionCapacity(user: User): Promise<SessionGateResult> {
  const max = effectiveMaxSessions(user);
  if (max == null) return { allowed: true };
  const active = await listActiveSessions(user.id);
  if (active.length < max) return { allowed: true };
  return {
    allowed: false,
    max_sessions: max,
    active_sessions: toSessionViews(active),
  };
}

export async function ensureUserPackageDefaults(userId: string): Promise<User | null> {
  const user = await findUserById(userId);
  return user ?? null;
}
