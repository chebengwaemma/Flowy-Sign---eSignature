import { connection } from "next/server";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";

export const dynamic = "force-dynamic";

export default async function HiddenAdminPage() {
  await connection();
  const store = await readStore();
  const settings = mergeSettings(store.site);
  const users = (store.users || []).map(({ password: _p, ...safe }) => safe);
  const documents = (store.documents || []).map((d) => ({
    id: d.id,
    title: d.title || "Untitled",
    status: d.status,
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
    recipients: (d.recipients || []).map((r) => ({ email: r?.email || "" })),
  }));

  return (
    <div className="space-y-4 app-meet-page">
      <ScrollMeetBlock side="left" distance={90} className="app-meet-block">
        <p className="text-sm text-[var(--muted)]">
          Changes save to MongoDB and update the live website immediately (home, templates, documents,
          teams, integrations, API, fax, pricing, and more).
        </p>
      </ScrollMeetBlock>
      <ScrollMeetBlock side="right" distance={110} className="app-meet-block">
        <AdminPanel
          settings={settings}
          orgName="Global site"
          users={users}
          documents={documents}
        />
      </ScrollMeetBlock>
    </div>
  );
}
