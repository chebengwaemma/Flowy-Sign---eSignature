import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, publicUser } from "@/lib/auth";
import { mergeSettings } from "@/lib/settings";
import { createUser, findUserByEmail, readStore } from "@/lib/store";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const store = await readStore();
  const settings = mergeSettings(store.site);
  if (!settings.signupEnabled) {
    return NextResponse.json({ error: "Signup is disabled by the administrator." }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Check your name, email, and password" }, { status: 400 });
  }

  const existing = await findUserByEmail(body.data.email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const user = await createUser(body.data);
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
