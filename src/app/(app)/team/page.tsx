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
    <div className="space-y-6 rise">
      <div>
        <h1 className="display text-4xl">Team</h1>
        <p className="mt-1 text-muted">Manage seats, roles, and workspace access.</p>
      </div>

      {(user.role === "owner" || user.role === "admin") && <InviteForm />}

      <div className="panel overflow-hidden">
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
                <td className="px-5 py-4 font-semibold">{m.name}</td>
                <td className="px-5 py-4 text-muted">{m.email}</td>
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

      {invites.length > 0 && (
        <p className="text-sm text-muted">{invites.length} pending invite(s)</p>
      )}
    </div>
  );
}
