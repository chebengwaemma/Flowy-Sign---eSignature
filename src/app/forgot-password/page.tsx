"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
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
    setMessage(data.message || "Check your email for the reset link and the 6-digit code.");
  }

  async function onCode(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setCodeError("");
    const res = await fetch("/api/auth/reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setCodeError(data.error || "Could not reset the password");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Logo />
      <h1 className="display mt-8 text-4xl">Forgot password</h1>
      <p className="mt-2 text-muted">
        We email a reset link and a 6-digit code. If the link does not open, enter the code here.
      </p>
      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
        {message && <p className="text-sm text-[var(--ok)]">{message}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link and code"}
        </button>
      </form>

      <form onSubmit={onCode} className="panel mt-4 space-y-4 p-6">
        <h2 className="text-lg font-semibold">Reset with a code</h2>
        <p className="text-sm text-muted">Use the 6-digit code from the email. It works for 15 minutes.</p>
        <div>
          <label className="label" htmlFor="code">
            6-digit code
          </label>
          <input
            id="code"
            className="field tracking-[0.3em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            At least 10 characters, with upper and lower case, a number, and a symbol.
          </p>
        </div>
        {codeError && <p className="text-sm text-[var(--bad)]">{codeError}</p>}
        <button className="btn btn-primary w-full" disabled={saving || code.length !== 6}>
          {saving ? "Saving…" : "Save password"}
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
