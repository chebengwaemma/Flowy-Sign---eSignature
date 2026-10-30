"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Invite failed");
      return;
    }
    setMessage(
      `Added ${data.credentials.email}. Temporary password: ${data.credentials.temporaryPassword}`,
    );
    setEmail("");
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel grid gap-4 p-6 md:grid-cols-4">
      <div>
        <label className="label">Name</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Role</label>
        <select
          className="field"
          value={role}
          onChange={(e) => setRole(e.target.value as "member" | "admin")}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <button className="btn btn-accent w-full" disabled={loading}>
          {loading ? "Inviting…" : "Invite"}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--bad)] md:col-span-4">{error}</p>}
      {message && <p className="text-sm text-accent-deep md:col-span-4">{message}</p>}
    </form>
  );
}
