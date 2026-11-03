import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getPlanFromSettings } from "@/lib/plans";
import { mergeSettings } from "@/lib/settings";
import { readStore, updateStore } from "@/lib/store";
import type { TeamInvite, User } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
  name: z.string().min(1).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "member") {
    return NextResponse.json({ error: "Only admins can invite" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = schema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const store = await readStore();
  const site = mergeSettings(store.site);
  if (!site.allowMemberInvites && user.role !== "owner") {
    return NextResponse.json({ error: "Invites are disabled by admin" }, { status: 403 });
  }
  if ((store.users || []).some((u) => u.email?.toLowerCase() === body.data.email.toLowerCase())) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const plan = getPlanFromSettings(user.plan || "free", site);
  const seatLimit = plan.seats;
  if (seatLimit >= 0) {
    const members = (store.users || []).filter((u) => u.orgId === user.orgId).length;
    if (members >= seatLimit) {
      return NextResponse.json(
        {
          error: `Seat limit reached (${seatLimit}). Upgrade your plan to add more teammates.`,
          code: "SEAT_LIMIT",
        },
        { status: 403 },
      );
    }
  }

  const now = new Date().toISOString();
  const invite: TeamInvite = {
    id: nanoid(10),
    orgId: user.orgId,
    email: body.data.email.toLowerCase(),
    role: body.data.role,
    invitedBy: user.id,
    status: "accepted",
    createdAt: now,
  };

  const newUser: User = {
    id: nanoid(10),
    email: invite.email,
    name: body.data.name || invite.email.split("@")[0],
    password: "welcome123",
    role: invite.role,
    orgId: user.orgId,
    plan: user.plan,
    billingInterval: user.billingInterval,
    createdAt: now,
  };

  await updateStore((s) => {
    s.invites.push(invite);
    s.users.push(newUser);
  });

  return NextResponse.json({
    invite,
    credentials: { email: newUser.email, temporaryPassword: "welcome123" },
  });
}
