import { nanoid } from "nanoid";
import { updateStore, readStore } from "./store";
import type { UserNotification } from "./types";

export async function createUserNotification(
  input: Omit<UserNotification, "id" | "createdAt" | "readAt">,
): Promise<UserNotification> {
  const row: UserNotification = {
    ...input,
    id: `ntf_${nanoid(12)}`,
    createdAt: new Date().toISOString(),
  };
  await updateStore((store) => {
    if (!Array.isArray(store.notifications)) store.notifications = [];
    store.notifications.unshift(row);
    store.notifications = store.notifications.slice(0, 200);
  });
  return row;
}

export async function listUserNotifications(userId: string, limit = 20) {
  const store = await readStore();
  return (store.notifications || [])
    .filter((n) => n.userId === userId)
    .slice(0, limit);
}

export async function markNotificationRead(userId: string, id: string) {
  await updateStore((store) => {
    const row = (store.notifications || []).find((n) => n.id === id && n.userId === userId);
    if (row && !row.readAt) row.readAt = new Date().toISOString();
  });
}
