"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send the reset email");
      return;
    }
    setMessage(data.message || "Check your email for the reset link.");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Logo />
      <h1 className="display mt-8 text-4xl">Forgot password</h1>
      <p className="mt-2 text-muted">We will email you a link to choose a new password.</p>
      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <div>
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
        </div>
        {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
        {message && <p className="text-sm text-[var(--ok)]">{message}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent-deep">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
