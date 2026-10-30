import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getOrgDocuments } from "@/lib/store";
import { formatDate, statusTone } from "@/lib/utils";

export default async function DocumentsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const docs = await getOrgDocuments(user.orgId);

  return (
    <div className="space-y-6 rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Documents</h1>
          <p className="mt-1 text-muted">Track drafts, sent packets, and completed agreements.</p>
        </div>
        <Link href="/documents/new" className="btn btn-accent">
          New request
        </Link>
      </div>

      <div className="panel overflow-hidden">
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
                <td className="px-5 py-4 text-muted">{doc.recipients.length}</td>
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
    </div>
  );
}
