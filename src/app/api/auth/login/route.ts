import { NextResponse } from "next/server";
import { z } from "zod";
import { publicUser, tryCreateSession } from "@/lib/auth";
import { deviceLabelFromRequest } from "@/lib/device-sessions";
import { findUserByEmail } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
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

    const session = await tryCreateSession(user.id, deviceLabelFromRequest(req));
    if (!session.ok) {
      return NextResponse.json(
        {
          error: session.error,
          code: session.code,
          max_sessions: session.max_sessions,
          active_sessions: session.active_sessions,
          pending_login_token: session.pending_login_token,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    console.error("[api/auth/login]", message);
    const dbDown = /database unavailable|mongo|network access|timed out/i.test(message);
    return NextResponse.json(
      {
        error: dbDown
          ? "Database temporarily unavailable. In MongoDB Atlas → Network Access, allow 0.0.0.0/0, then try again."
          : "Login failed. Please try again.",
      },
      { status: 503 },
    );
  }
}
