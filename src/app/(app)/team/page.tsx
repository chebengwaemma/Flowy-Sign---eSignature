import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { getSessionUser } from "@/lib/auth";
import { getOrgInvites, getOrgMembers } from "@/lib/store";
import { InviteForm } from "./InviteForm";
import { formatDate, statusTone } from "@/lib/utils";

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [members, invites] = await Promise.all([
    getOrgMembers(user.orgId),
    getOrgInvites(user.orgId),
  ]);

  return (
    <div className="app-meet-page space-y-6">
      <ScrollMeetBlock side="left" distance={90}>
        <h1 className="display text-3xl sm:text-4xl">Team</h1>
        <p className="mt-1 text-muted">Manage seats, roles, and workspace access.</p>
      </ScrollMeetBlock>

      {(user.role === "owner" || user.role === "admin") && (
        <ScrollMeetBlock side="right" distance={100}>
          <InviteForm />
        </ScrollMeetBlock>
      )}

      <ScrollMeetBlock side="left" distance={120}>
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-4 font-semibold">{m.name || "Member"}</td>
                  <td className="px-5 py-4 text-muted">{m.email || ""}</td>
                  <td className="px-5 py-4">
                    <span className={statusTone(m.role === "owner" ? "completed" : "pending")}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollMeetBlock>

      {invites.length > 0 && (
        <ScrollMeetBlock side="right" distance={80}>
          <p className="text-sm text-muted">{invites.length} pending invite(s)</p>
        </ScrollMeetBlock>
      )}
    </div>
  );
}
