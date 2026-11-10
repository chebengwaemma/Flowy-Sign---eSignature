"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not change the password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Logo />
      <h1 className="display mt-8 text-4xl">Choose a new password</h1>
      <p className="mt-2 text-muted">
        {forced
          ? "This temporary password works once. Set a password you will use from now on."
          : "Enter your current password, then choose a new one."}
      </p>
      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="current-password">
            {forced ? "Temporary password" : "Current password"}
          </label>
          <input
            id="current-password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            className="field"
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            At least 10 characters, with upper and lower case, a number, and a symbol.
          </p>
        </div>
        {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}
