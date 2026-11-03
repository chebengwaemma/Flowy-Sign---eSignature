import { NextResponse } from "next/server";
import { z } from "zod";
import { attachAdminSession, loginAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const body = schema.safeParse(raw);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const admin = await loginAdmin(body.data.email, body.data.password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const res = NextResponse.json({ admin });
    await attachAdminSession(res, admin);
    return res;
  } catch (err) {
    console.error("[admin/login]", err);
    const message = err instanceof Error ? err.message : "Admin login failed";
    return NextResponse.json(
      {
        error: /mongo|database|MONGODB/i.test(message)
          ? "Admin login failed. Set MONGODB_URI in Vercel and allow Atlas access from 0.0.0.0/0."
          : "Admin login failed. Check MongoDB connection and redeploy latest code.",
      },
      { status: 500 },
    );
  }
}
