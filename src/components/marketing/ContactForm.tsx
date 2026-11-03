"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "dry" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setError(data?.error || "Could not send message");
        return;
      }
      if (data.emailDryRun) {
        setStatus("dry");
        return;
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("err");
      setError("Network error — try again");
    }
  }

  return (
    <form onSubmit={onSubmit} className="lp-contact-form panel mx-auto mt-10 max-w-xl space-y-4 p-6">
      <div>
        <label className="label" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div>
        <label className="label" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="contact-subject">
          Subject
        </label>
        <input
          id="contact-subject"
          className="field"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="field min-h-[140px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
        />
      </div>
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {status === "ok" && <p className="text-sm text-[var(--ok)]">Message sent — we&apos;ll get back to you soon.</p>}
      {status === "dry" && (
        <p className="text-sm text-muted">
          Message accepted, but outbound email is not configured yet (Resend API key missing).
        </p>
      )}
      <button type="submit" className="lp-btn" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
