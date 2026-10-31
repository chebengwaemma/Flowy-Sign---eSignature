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

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let store;
    try {
      store = await readStore();
    } catch (err) {
      console.error("[signup] readStore", err);
      return NextResponse.json(
        {
          error:
            "Server database is unavailable. Set MONGODB_URI in Vercel and allow network access from anywhere in Atlas.",
        },
        { status: 503 },
      );
    }

    const settings = mergeSettings(store.site);
    if (!settings.signupEnabled) {
      return NextResponse.json(
        { error: "Signup is disabled by the administrator." },
        { status: 403 },
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const body = schema.safeParse(raw);
    if (!body.success) {
      return NextResponse.json(
        { error: "Check your name, email, and password" },
        { status: 400 },
      );
    }

    const existing = await findUserByEmail(body.data.email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const user = await createUser(body.data);
    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error("[signup]", err);
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json(
      {
        error: /database|mongo|MONGODB/i.test(message)
          ? message
          : "Signup failed. Please try again or contact support.",
      },
      { status: 500 },
    );
  }
}
