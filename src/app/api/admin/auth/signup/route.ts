import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Admin signup is disabled. Login only." },
    { status: 403 },
  );
}
