import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { applyPaidPlan } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import type { BillingInterval, PlanId } from "@/lib/types";

const schema = z.object({
  sessionId: z.string().min(10),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", result: "unsuccess" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Missing checkout session", result: "unsuccess" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured", result: "unsuccess" }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(body.data.sessionId);
    if (session.metadata?.userId && session.metadata.userId !== user.id) {
      return NextResponse.json({ error: "Session does not belong to this user", result: "unsuccess" }, { status: 403 });
    }

    if (session.status === "expired") {
      return NextResponse.json({ error: "Checkout expired — please try again", result: "unsuccess" }, { status: 400 });
    }

    const plan = (session.metadata?.plan || "") as PlanId;
    const interval = (session.metadata?.interval || "monthly") as BillingInterval;
    if (!["starter", "pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Unknown plan on session", result: "unsuccess" }, { status: 400 });
    }

    if (session.status !== "complete" && session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment not completed — try again",
          result: "unsuccess",
          paymentStatus: session.payment_status,
        },
        { status: 402 },
      );
    }

    const customer = typeof session.customer === "string" ? session.customer : undefined;
    await applyPaidPlan(user.id, user.orgId, plan, interval, customer);

    return NextResponse.json({
      result: "success",
      plan,
      interval,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm payment";
    return NextResponse.json({ error: message, result: "unsuccess" }, { status: 502 });
  }
}
