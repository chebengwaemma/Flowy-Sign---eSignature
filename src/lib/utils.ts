import { clsx, type ClassValue } from "clsx";
import { formatLocalStamp } from "./signing-time";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatLocalStamp(iso);
}

export function statusTone(status: string) {
  switch (status) {
    case "completed":
    case "delivered":
    case "received":
    case "signed":
      return "tone-ok";
    case "sent":
    case "queued":
    case "sending":
    case "viewed":
    case "pending":
      return "tone-wait";
    case "failed":
    case "void":
    case "revoked":
      return "tone-bad";
    default:
      return "tone-muted";
  }
}
