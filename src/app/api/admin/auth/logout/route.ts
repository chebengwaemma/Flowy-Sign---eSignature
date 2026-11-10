import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url), { status: 303 });
  clearAdminSessionCookie(res);
  return res;
}
