import { nanoid } from "nanoid";
import { sendEmail } from "./email";
import { updateStore } from "./store";
import type { ResetMailJob, User } from "./types";

const MAX_ATTEMPTS = 5;

export function registeredResetAddress(
  user: Pick<User, "id" | "email" | "resetOtpHash"> | undefined,
  job: Pick<ResetMailJob, "userId" | "to" | "otpHash">,
): string | null {
  if (!user || user.id !== job.userId) return null;
  const registered = (user.email || "").trim().toLowerCase();
  const requested = (job.to || "").trim().toLowerCase();
  if (!registered || !requested.includes("@") || registered !== requested) return null;
  if (registered.includes(",") || registered.includes(";")) return null;
  if (!user.resetOtpHash || user.resetOtpHash !== job.otpHash) return null;
  return registered;
}

function backoffMs(attempts: number) {
  return Math.min(60_000, 800 * 2 ** Math.max(0, attempts - 1));
}

async function sendViaResend(job: ResetMailJob, to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const mailed = await sendEmail({
      to,
      subject: job.subject,
      html: job.html,
      text: job.text,
    });
    if (!mailed.ok || mailed.dryRun) {
      return { ok: false, error: mailed.error || "Email is not configured" };
    }
    console.info("[reset-mail] accepted", job.userId);
    return { ok: true };
  } catch (err) {
    console.warn("[reset-mail] request failed", (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}

export async function enqueuePasswordReset(input: {
  userId: string;
  to: string;
  otpHash: string;
  subject: string;
  text: string;
  html: string;
}) {
  const to = input.to.trim().toLowerCase();
  const job: ResetMailJob = {
    id: nanoid(12),
    kind: "password-reset",
    userId: input.userId,
    to,
    otpHash: input.otpHash,
    subject: input.subject,
    text: input.text,
    html: input.html,
    idempotencyKey: `reset_${input.userId}_${input.otpHash.slice(0, 16)}`,
    attempts: 0,
    nextAttemptAt: new Date().toISOString(),
  };
  await updateStore((store) => {
    const user = store.users.find((row) => row.id === input.userId);
    if (registeredResetAddress(user, job) !== to) return;
    store.mailQueue = (store.mailQueue || []).filter(
      (existing) => !(existing.userId === job.userId && existing.kind === "password-reset"),
    );
    store.mailQueue.push(job);
  });
}

/** Send due reset mail. Each job is re-checked against that user's current row. */
export async function drainResetMailQueue(limit = 4) {
  for (let n = 0; n < limit; n += 1) {
    const claimed = await claimNextResetJob();
    if (!claimed) return;
    const sent = await sendViaResend(claimed.job, claimed.to);
    await settleResetJob(claimed.job.id, sent);
    if (!sent.ok) return;
  }
}

async function claimNextResetJob(): Promise<{ job: ResetMailJob; to: string } | null> {
  let claimed: { job: ResetMailJob; to: string } | null = null;
  const now = Date.now();
  await updateStore((store) => {
    const queue = store.mailQueue || [];
    store.mailQueue = queue;
    const job = queue.find((item) => {
      if (item.kind !== "password-reset") return false;
      if (Date.parse(item.nextAttemptAt) > now) return false;
      if (item.lockedUntil && Date.parse(item.lockedUntil) > now) return false;
      return true;
    });
    if (!job) return;
    const user = store.users.find((row) => row.id === job.userId);
    const to = registeredResetAddress(user, job);
    if (!to) {
      store.mailQueue = queue.filter((item) => item.id !== job.id);
      return;
    }
    job.attempts += 1;
    job.lockedUntil = new Date(now + 25_000).toISOString();
    claimed = { job: { ...job, to }, to };
  });
  return claimed;
}

async function settleResetJob(jobId: string, sent: { ok: boolean; error?: string }) {
  await updateStore((store) => {
    const queue = store.mailQueue || [];
    const job = queue.find((item) => item.id === jobId);
    if (!job) return;
    if (sent.ok || job.attempts >= MAX_ATTEMPTS) {
      store.mailQueue = queue.filter((item) => item.id !== jobId);
      if (!sent.ok) console.warn("[reset-mail] dropped after retries", job.userId, sent.error || "");
      return;
    }
    job.lockedUntil = undefined;
    job.lastError = sent.error;
    const wait = job.attempts < 2 ? 0 : backoffMs(job.attempts);
    job.nextAttemptAt = new Date(Date.now() + wait).toISOString();
    const user = store.users.find((row) => row.id === job.userId);
    if (registeredResetAddress(user, job) !== job.to) {
      store.mailQueue = queue.filter((item) => item.id !== jobId);
    }
  });
}
