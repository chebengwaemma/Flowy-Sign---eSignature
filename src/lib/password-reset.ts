import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function secretsMatch(storedHash: string, raw: string) {
  try {
    const a = Buffer.from(storedHash, "hex");
    const b = Buffer.from(hashSecret(raw), "hex");
    if (a.length === 0 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function makeResetToken() {
  return randomBytes(24).toString("hex");
}

/** Six digits, including leading zeros. */
export function makeResetOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** One-time password an admin can read out. Not stored except as the account password. */
export function makeTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let body = "";
  for (const byte of bytes) body += alphabet[byte % alphabet.length];
  return `Tmp-${body}`;
}
