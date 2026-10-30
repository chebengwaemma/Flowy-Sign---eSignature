import { NextResponse } from "next/server";
import { z } from "zod";
import { loginAdmin } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }
    const admin = await loginAdmin(body.data.email, body.data.password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return NextResponse.json({ admin });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Admin login failed. Check MongoDB connection." },
      { status: 500 },
    );
  }
}
