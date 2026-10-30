"use client";

import { useEffect, useState } from "react";
import { formatDate, statusTone } from "@/lib/utils";

type Fax = {
  id: string;
  direction: string;
  toNumber: string;
  fromNumber: string;
  subject: string;
  pages: number;
  status: string;
  createdAt: string;
};

export default function FaxPage() {
  const [faxes, setFaxes] = useState<Fax[]>([]);
  const [toNumber, setToNumber] = useState("+1 (555) 010-");
  const [subject, setSubject] = useState("");
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/fax");
    const data = await res.json();
    if (res.ok) setFaxes(data.faxes);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toNumber, subject, pages }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Send failed");
      return;
    }
    setSubject("");
    await load();
  }

  return (
    <div className="space-y-6 rise">
      <div>
        <h1 className="display text-4xl">Fax</h1>
        <p className="mt-1 text-muted">Send and receive faxes from the same workspace inbox.</p>
      </div>

      <form onSubmit={send} className="panel grid gap-4 p-6 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="to">
            To number
          </label>
          <input id="to" className="field" value={toNumber} onChange={(e) => setToNumber(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input id="subject" className="field" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pages">
            Pages
          </label>
          <input
            id="pages"
            type="number"
            min={1}
            max={50}
            className="field"
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-sm text-[var(--bad)] md:col-span-3">{error}</p>}
        <div className="md:col-span-3">
          <button className="btn btn-accent" disabled={loading}>
            {loading ? "Queuing…" : "Send fax"}
          </button>
        </div>
      </form>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-muted">
            <tr>
              <th className="px-5 py-3">Direction</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Numbers</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {faxes.map((fax) => (
              <tr key={fax.id}>
                <td className="px-5 py-4 capitalize">{fax.direction}</td>
                <td className="px-5 py-4 font-semibold">
                  {fax.subject}
                  <span className="ml-2 text-xs font-normal text-muted">{fax.pages}p</span>
                </td>
                <td className="px-5 py-4 text-muted">
                  {fax.direction === "outbound" ? fax.toNumber : fax.fromNumber}
                </td>
                <td className="px-5 py-4 text-muted">{formatDate(fax.createdAt)}</td>
                <td className="px-5 py-4">
                  <span className={statusTone(fax.status)}>{fax.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
