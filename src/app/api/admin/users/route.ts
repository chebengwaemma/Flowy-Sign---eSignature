import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { publicUser } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/store";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({ users: store.users.map((u) => publicUser(u)) });
}

const patchSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "admin", "member"]).optional(),
  plan: z.enum(["free", "pro", "pro_5", "business", "business_5"]).optional(),
  name: z.string().min(1).optional(),
});

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let updated = null;
  await updateStore((store) => {
    const target = store.users.find((u) => u.id === body.data.userId);
    if (!target) return;
    if (body.data.role) target.role = body.data.role;
    if (body.data.plan) target.plan = body.data.plan;
    if (body.data.name) target.name = body.data.name;
    updated = publicUser(target);
  });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    const body = await req.json();
    userId = String(body?.userId || "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    let removed = false;
    await updateStore((store) => {
      const before = store.users.length;
      store.users = store.users.filter((u) => u.id !== userId);
      removed = store.users.length < before;
      if (removed) {
        store.deviceSessions = (store.deviceSessions || []).filter((s) => s.userId !== userId);
        store.notifications = (store.notifications || []).filter((n) => n.userId !== userId);
      }
    });
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    console.warn("[admin/users DELETE]", (err as Error).message);
    return NextResponse.json({ error: "Could not delete user (busy). Try again." }, { status: 503 });
  }
}
