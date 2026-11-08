import { NextResponse } from "next/server";
import { readSiteRevision } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Tiny poll target for open website tabs. */
export async function GET() {
  const revision = await readSiteRevision();
  return NextResponse.json(
    { revision },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
