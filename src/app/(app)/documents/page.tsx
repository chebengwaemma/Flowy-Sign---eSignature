import Link from "next/link";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { getSessionUser } from "@/lib/auth";
import { getOrgDocuments } from "@/lib/store";
import { formatDate, statusTone } from "@/lib/utils";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const docs = await getOrgDocuments(user.orgId);
  const { missing } = await searchParams;

  return (
    <div className="app-meet-page space-y-6">
      <ScrollMeetBlock side="left" distance={90}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="display text-3xl sm:text-4xl">Documents</h1>
            <p className="mt-1 text-muted">Track drafts, sent packets, and completed agreements.</p>
          </div>
          <Link href="/documents/new" className="btn btn-accent">
            New request
          </Link>
        </div>
      </ScrollMeetBlock>

      {missing ? (
        <div className="rounded-2xl border border-[#f0d9c8] bg-[#fff8f3] px-5 py-4 text-sm text-ink">
          That document could not be opened. It may still be saving — open it from the list below, or send again.
        </div>
      ) : null}

      <ScrollMeetBlock side="right" distance={120}>
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Recipients</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/40">
                  <td className="px-5 py-4">
                    <Link href={`/documents/${doc.id}`} className="font-semibold hover:underline">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted">{(doc.recipients || []).length}</td>
                  <td className="px-5 py-4 text-muted">{formatDate(doc.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <span className={statusTone(doc.status)}>{doc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.length === 0 && (
            <p className="px-5 py-10 text-center text-muted">No documents yet.</p>
          )}
        </div>
      </ScrollMeetBlock>
    </div>
  );
}
