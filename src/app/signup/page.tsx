"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLivePublicSite } from "@/components/LiveSiteSync";
import { Logo } from "@/components/Logo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { ready, signupEnabled, showGoogle, brandName } = useLivePublicSite();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Signup failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (ready && !signupEnabled) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 app-meet-page">
        <ScrollMeetBlock side="left" distance={90}>
          <Logo label={brandName} />
          <h1 className="display mt-8 text-4xl">Signup closed</h1>
          <p className="mt-2 text-muted">New accounts are disabled by the administrator.</p>
          <Link href="/login" className="btn btn-primary mt-6 inline-flex">
            Log in
          </Link>
        </ScrollMeetBlock>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 app-meet-page">
      <ScrollMeetSplit className="app-meet-stack" itemClassName="app-meet-item" distance={90} stagger={0.1}>
        <Logo label={brandName} />
        <div>
          <h1 className="display mt-8 text-4xl">Create your workspace</h1>
          <p className="mt-2 text-muted">Start with {brandName} in minutes.</p>
        </div>
      </ScrollMeetSplit>

      <ScrollMeetBlock side="right" distance={100} className="app-meet-block mt-8">
        <div className="panel space-y-4 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Work email
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
            <button className="btn btn-accent w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>

          {showGoogle && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <GoogleLoginButton label="Sign up with Google" />
            </>
          )}
        </div>
      </ScrollMeetBlock>

      <ScrollMeetBlock side="left" distance={80} className="app-meet-block">
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-deep">
            Log in
          </Link>
        </p>
      </ScrollMeetBlock>
    </div>
  );
}
