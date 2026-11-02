"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { SessionLimitModal } from "@/components/SessionLimitModal";

type LimitState = {
  error: string;
  max_sessions: number;
  active_sessions: {
    session_id: string;
    device_label: string;
    last_seen_at: string;
    created_at?: string;
  }[];
  pending_login_token: string;
};

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
  const [limit, setLimit] = useState<LimitState | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (searchParams.get("session_limit") !== "1") return;
    try {
      const raw = document.cookie
        .split("; ")
        .find((row) => row.startsWith("flowy_session_limit="))
        ?.split("=")
        .slice(1)
        .join("=");
      if (!raw) return;
      const parsed = JSON.parse(decodeURIComponent(raw)) as LimitState;
      if (parsed?.pending_login_token) setLimit(parsed);
      document.cookie = "flowy_session_limit=; path=/; max-age=0";
    } catch {
      /* ignore */
    }
  }, [searchParams]);

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
    if (res.status === 409 && data?.code === "SESSION_LIMIT_REACHED") {
      setLimit({
        error: data.error || "",
        max_sessions: data.max_sessions || 5,
        active_sessions: data.active_sessions || [],
        pending_login_token: data.pending_login_token || "",
      });
      return;
    }
    if (!res.ok) {
      setError(data?.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function terminateAndContinue(sessionId: string) {
    if (!limit?.pending_login_token) return;
    setEndingId(sessionId);
    const res = await fetch("/api/auth/sessions/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pending_login_token: limit.pending_login_token,
        terminate_session_id: sessionId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEndingId(null);
    if (!res.ok) {
      setError(data?.error || "Could not end that session");
      setLimit(null);
      return;
    }
    setLimit(null);
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

      <SessionLimitModal
        open={!!limit}
        error={limit?.error || ""}
        maxSessions={limit?.max_sessions || 5}
        sessions={limit?.active_sessions || []}
        pendingToken={limit?.pending_login_token || ""}
        loadingId={endingId}
        onClose={() => setLimit(null)}
        onTerminate={terminateAndContinue}
      />
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
