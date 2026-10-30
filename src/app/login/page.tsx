"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [brandName, setBrandName] = useState("Flowy Sign - eSignature");

  useEffect(() => {
    fetch("/api/public/site")
      .then((r) => r.json())
      .then((d) => {
        setShowGoogle(d.showGoogleLogin !== false);
        setSignupEnabled(d.signupEnabled !== false);
        if (d.brandName) setBrandName(d.brandName);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12 rise">
      <Logo label={brandName} />
      <h1 className="display mt-8 text-4xl">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to {brandName}.</p>

      <div className="panel mt-8 space-y-4 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
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
          <div>
            <label className="label" htmlFor="password">
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
          </div>
          {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        {showGoogle && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <GoogleLoginButton />
          </>
        )}
      </div>

      {signupEnabled && (
        <p className="mt-6 text-sm text-muted">
          <Link href="/signup" className="font-semibold text-accent-deep">
            Create account
          </Link>
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
