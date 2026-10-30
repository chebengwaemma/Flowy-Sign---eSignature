import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, publicUser } from "@/lib/auth";
import { findUserByEmail } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  const user = await findUserByEmail(body.data.email);
  if (!user || !user.password || user.password !== body.data.password) {
    return NextResponse.json(
      {
        error:
          user?.authProvider === "google"
            ? "This account uses Google login. Click Continue with Google."
            : "Invalid email or password",
      },
      { status: 401 },
    );
  }

  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
