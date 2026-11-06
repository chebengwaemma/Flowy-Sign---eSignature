import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildDocumentDownload } from "@/lib/document-download";
import { getAppUrl } from "@/lib/app-url";
import { readStore } from "@/lib/store";
import { isPaidSubscriber } from "@/lib/subscription";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Sign in required",
        code: "AUTH_REQUIRED",
        loginUrl: `/login?next=${encodeURIComponent(`/download/${token}`)}`,
      },
      { status: 401 },
    );
  }

  const store = await readStore({ downloadToken: token });
  const doc = store.documents.find((d) => d.downloadToken === token);
  if (!doc) {
    return NextResponse.json({ error: "Invalid or expired download link" }, { status: 404 });
  }
  if (doc.orgId !== user.orgId && doc.ownerId !== user.id) {
    return NextResponse.json({ error: "Not allowed to download this document" }, { status: 403 });
  }

  if (!isPaidSubscriber(user)) {
    const billingUrl = `${getAppUrl()}/billing?reason=download&token=${encodeURIComponent(token)}`;
    return NextResponse.json(
      {
        error: "A paid plan is required to download documents.",
        code: "PAYMENT_REQUIRED",
        billingUrl: `/billing?reason=download&token=${encodeURIComponent(token)}`,
        absoluteBillingUrl: billingUrl,
      },
      { status: 402 },
    );
  }

  const file = await buildDocumentDownload(doc);
  const body =
    typeof file.body === "string" ? Buffer.from(file.body, "utf8") : file.body;

  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${file.filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
