"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Logo";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reset the password");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Logo />
      <h1 className="display mt-8 text-4xl">Choose a new password</h1>
      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            At least 10 characters, with upper and lower case, a number, and a symbol.
          </p>
        </div>
        {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
        {!token && <p className="text-sm text-[var(--bad)]">This reset link is missing its token.</p>}
        <button className="btn btn-primary w-full" disabled={loading || !token}>
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href="/forgot-password" className="font-semibold text-accent-deep">
          Request a new link
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
