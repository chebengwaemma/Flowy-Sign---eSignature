import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
