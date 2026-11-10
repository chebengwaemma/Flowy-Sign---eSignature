import { connection } from "next/server";
import { mergeSettings } from "@/lib/settings";
import { readStore } from "@/lib/store";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";

export const dynamic = "force-dynamic";

export default async function HiddenAdminPage() {
  await connection();
  let store: Awaited<ReturnType<typeof readStore>> | null = null;
  let dbError = "";
  try {
    store = await readStore();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database unavailable";
    console.error("[admin] readStore", dbError);
  }
  const settings = mergeSettings(store?.site);
  const users = (store?.users || []).map(({ password: _p, ...safe }) => safe);
  const documents = (store?.documents || []).map((d) => ({
    id: d.id,
    title: d.title || "Untitled",
    status: d.status,
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
    recipients: (d.recipients || []).map((r) => ({ email: r?.email || "" })),
  }));

  return (
    <div className="space-y-4 app-meet-page">
      {dbError ? (
        <p className="rounded-xl border border-[var(--bad)] bg-red-50 px-4 py-3 text-sm text-[var(--bad)]">
          Database is unreachable, so live settings did not load. In MongoDB Atlas open Network Access and
          allow 0.0.0.0/0, then refresh this page.
        </p>
      ) : null}
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
