"use client";

import { useState } from "react";

export function AdminLoginForm() {
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
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Login failed");
        setLoading(false);
        return;
      }
      // Full navigation so the session cookie is always sent on the next request
      window.location.assign("/admin");
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-shell">
      <form onSubmit={onSubmit} className="admin-auth-card" autoComplete="on">
        <p className="admin-auth-kicker">Hidden control center</p>
        <h1>Admin login</h1>
        <p className="admin-auth-sub">Login only. Signup is disabled.</p>

        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          className="field"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="label mt-3" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="mt-3 text-sm text-[var(--bad)]">{error}</p> : null}

        <button className="btn btn-primary mt-5 w-full" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Enter admin"}
        </button>
      </form>
    </div>
  );
}
