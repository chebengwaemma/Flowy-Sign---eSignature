import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isPaidSubscriber } from "@/lib/subscription";

/** Lightweight paid-plan check used by in-app download buttons. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  if (!isPaidSubscriber(user)) {
    return NextResponse.json(
      {
        error: "A paid plan is required to download documents.",
        code: "PAYMENT_REQUIRED",
        billingUrl: "/billing?reason=download",
      },
      { status: 402 },
    );
  }
  return NextResponse.json({ ok: true });
}
