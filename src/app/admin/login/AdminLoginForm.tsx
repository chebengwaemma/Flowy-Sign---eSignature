"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-shell">
      <form onSubmit={onSubmit} className="admin-auth-card">
        <p className="admin-auth-kicker">Hidden control center</p>
        <h1>Admin login</h1>
        <p className="admin-auth-sub">Login only. Signup is disabled.</p>

        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="label mt-3" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="mt-3 text-sm text-[var(--bad)]">{error}</p> : null}

        <button className="btn btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Signing in…" : "Enter admin"}
        </button>
      </form>
    </div>
  );
}
