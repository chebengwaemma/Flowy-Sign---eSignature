import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default async function HiddenAdminPage() {
  const store = await readStore();
  const settings = mergeSettings(store.site);
  const users = store.users.map(({ password: _p, ...safe }) => safe);
  const documents = store.documents.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    updatedAt: d.updatedAt,
    recipients: d.recipients.map((r) => ({ email: r.email })),
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Changes save to MongoDB and update the live website immediately (home, templates, documents,
        teams, integrations, API, fax, pricing, and more).
      </p>
      <AdminPanel
        settings={settings}
        orgName="Global site"
        users={users}
        documents={documents}
      />
    </div>
  );
}
