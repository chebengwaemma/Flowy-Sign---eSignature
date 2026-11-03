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
  plan: z.enum(["free", "starter", "pro", "business"]).optional(),
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

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  await updateStore((store) => {
    store.users = store.users.filter((u) => u.id !== userId);
  });

  return NextResponse.json({ ok: true });
}
