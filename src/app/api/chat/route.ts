import { NextResponse } from "next/server";
import { z } from "zod";
import { answerChat } from "@/lib/chat";

const schema = z.object({ message: z.string().min(1).max(2000) });

/** Public FAQ assistant — no login required so marketing + app chat both work */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = schema.safeParse(json);
    if (!body.success) {
      return NextResponse.json(
        { reply: "Please type a short question and I’ll help." },
        { status: 200 },
      );
    }

    const reply = answerChat(body.data.message);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        reply:
          "I hit a snag for a second. Ask again — I can help with signing, plans, fax, team, or billing.",
      },
      { status: 200 },
    );
  }
}
