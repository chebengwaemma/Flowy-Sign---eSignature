import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { readStore } from "@/lib/store";
import { isPaidSubscriber } from "@/lib/subscription";
import { DownloadAction } from "./DownloadAction";

export const dynamic = "force-dynamic";

export default async function DownloadGatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/download/${token}`)}`);
  }

  const store = await readStore();
  const doc = store.documents.find((d) => d.downloadToken === token);
  if (!doc) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="display text-3xl">Link expired</h1>
        <p className="mt-2 text-muted">This download link is invalid or no longer available.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6 inline-flex">
          Go to Home
        </Link>
      </main>
    );
  }

  if (doc.orgId !== user.orgId && doc.ownerId !== user.id) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="display text-3xl">Access denied</h1>
        <p className="mt-2 text-muted">This document belongs to another workspace.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6 inline-flex">
          Go to Home
        </Link>
      </main>
    );
  }

  const paid = isPaidSubscriber(user);
  if (!paid) {
    redirect(`/billing?reason=download&token=${encodeURIComponent(token)}`);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-deep">Download ready</p>
      <h1 className="display mt-2 text-3xl text-ink">{doc.title}</h1>
      <p className="mt-2 text-muted">
        Your plan is active. Click below to download the file from your email link.
      </p>
      <DownloadAction token={token} />
      <Link href="/documents" className="mt-4 inline-flex text-sm font-semibold text-accent-deep underline">
        Back to documents
      </Link>
    </main>
  );
}
