import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { readStore } from "@/lib/store";
import { formatDate, statusTone } from "@/lib/utils";
import { DocumentSurface } from "@/components/signature/DocumentSurface";
import { DownloadSignedButton } from "@/components/signature/DownloadSignedButton";
import { SendActions } from "./SendActions";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const store = await readStore();
  const doc = store.documents.find((d) => d.id === id && d.orgId === user.orgId);
  if (!doc) notFound();

  const recipients = doc.recipients || [];
  const fields = doc.fields || [];
  const safeDoc = {
    ...doc,
    fields,
    recipients: recipients.map((r) => ({ ...r })),
  };

  return (
    <div className="space-y-6 rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/documents" className="text-sm font-semibold text-accent-deep">
            ← Documents
          </Link>
          <h1 className="display mt-2 text-4xl">{doc.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={statusTone(doc.status)}>{doc.status}</span>
            <span className="text-sm text-muted">Updated {formatDate(doc.updatedAt)}</span>
            {doc.fileKind && doc.fileKind !== "text" && (
              <span className="text-sm text-muted">· {doc.fileKind.toUpperCase()} original preserved</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadSignedButton document={safeDoc} />
          <SendActions id={doc.id} status={doc.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <DocumentSurface
            content={doc.content}
            fileKind={doc.fileKind}
            fileDataUrl={doc.fileDataUrl}
            fields={fields}
            highlightPending
          />
          <p className="text-sm text-muted">
            Signature marks sit on top of the original. The uploaded file content is never rewritten.
          </p>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-semibold">Recipients</h2>
            <ul className="mt-3 space-y-3">
              {recipients.map((r) => (
                <li key={r.id} className="rounded-2xl bg-mist/70 p-3">
                  <p className="font-semibold">{r.name || "Recipient"}</p>
                  <p className="text-sm text-muted">{r.email || ""}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={statusTone(r.status)}>{r.status}</span>
                    {(doc.status === "sent" || doc.status === "viewed") &&
                      r.status !== "signed" &&
                      r.token && (
                      <a
                        className="text-xs font-semibold text-accent-deep underline"
                        href={`/sign/${r.token}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open sign link
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
