"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { DocumentSurface } from "@/components/signature/DocumentSurface";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { DownloadSignedButton } from "@/components/signature/DownloadSignedButton";
import type { DocFileKind, Document, SignatureMark } from "@/lib/types";

type Payload = {
  document: {
    id: string;
    title: string;
    content: string;
    status: string;
    fileKind?: DocFileKind;
    fileDataUrl?: string;
    fileName?: string;
    fields: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      value?: string;
      signature?: SignatureMark;
    }>;
    completedAt?: string;
    recipients?: Document["recipients"];
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    status: string;
    preferredSignatureStyle?: SignatureMark["style"];
  };
};

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [mark, setMark] = useState<SignatureMark | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullDoc, setFullDoc] = useState<Document | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sign/${params.token}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.recipient || !json?.document) {
          setError(json?.error || "Link unavailable");
          return;
        }
        setData(json);
        setMark({
          mode: "typed",
          text: json.recipient.name || json.recipient.email || "",
          style: json.recipient.preferredSignatureStyle || "elegant",
        });
        if (json.recipient.status === "signed") {
          setDone(true);
          if (json.document.status === "completed" && json.fullDocument) {
            setFullDoc(json.fullDocument);
          }
        }
      } catch {
        setError("Link unavailable");
      }
    }
    load();
  }, [params.token]);

  async function submit() {
    if (!mark) return;
    if (mark.mode === "typed" && !mark.text?.trim()) return;
    if (mark.mode === "image" && !mark.imageDataUrl) return;

    setLoading(true);
    setError("");
    const res = await fetch(`/api/sign/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signature: mark.mode === "typed" ? mark.text?.trim() : mark.text || data?.recipient.name,
        initials: mark.mode === "typed" ? mark.text?.trim().slice(0, 2) : undefined,
        signatureMark: mark,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(json?.error || "Could not sign");
      return;
    }
    setDone(true);
    if (json?.document) setFullDoc(json.document);
    setData((prev) => {
      if (!prev || !mark) return prev;
      return {
        ...prev,
        recipient: { ...prev.recipient, status: "signed" },
        document: {
          ...prev.document,
          status: json?.completed ? "completed" : prev.document.status,
          fields: (prev.document.fields || []).map((f) =>
            f.type === "signature" || f.type === "initials"
              ? {
                  ...f,
                  value: mark.mode === "typed" ? mark.text : mark.text || prev.recipient.name,
                  signature: mark,
                }
              : f,
          ),
        },
      };
    });
  }

  const canSubmit =
    mark &&
    ((mark.mode === "typed" && !!mark.text?.trim()) ||
      (mark.mode === "image" && !!mark.imageDataUrl));

  if (error && !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <Logo />
        <p className="mt-8 text-[var(--bad)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 text-muted">
        Loading document…
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Logo />
      <h1 className="display mt-8 text-4xl">{data.document.title}</h1>
      <p className="mt-2 text-muted">
        Signing as {data.recipient.name} ({data.recipient.email})
      </p>
      <p className="mt-1 text-sm text-muted">
        Your signature is placed on the document as an overlay — the original file stays unchanged.
      </p>

      <div className="mt-8">
        <DocumentSurface
          content={data.document.content}
          fileKind={data.document.fileKind}
          fileDataUrl={data.document.fileDataUrl}
          fields={data.document.fields.map((f) => ({
            ...f,
            type: f.type as "signature" | "initials" | "date" | "text",
            signature: done ? f.signature || mark || undefined : f.signature,
            value: done ? f.value || mark?.text : f.value,
          }))}
          highlightPending={!done}
        />
      </div>

      <div className="panel mt-6 space-y-4 p-6">
        {done ? (
          <div>
            <p className="tone-ok">Signed</p>
            <p className="mt-2 text-sm text-muted">
              Thank you. The original document was not modified — only signature marks were added.
            </p>
            {fullDoc?.status === "completed" && (
              <div className="mt-4">
                <DownloadSignedButton document={fullDoc} />
              </div>
            )}
            {!fullDoc && (
              <p className="mt-3 text-sm text-muted">
                When all parties have signed, the completed document can be downloaded from the sender’s
                Documents page.
              </p>
            )}
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-lg">Create your signature</h2>
            <SignaturePad defaultName={data.recipient.name} value={mark} onChange={setMark} />
            {error && <p className="text-[var(--bad)] text-sm">{error}</p>}
            <button
              className="btn btn-accent"
              disabled={loading || !canSubmit}
              onClick={submit}
            >
              {loading ? "Submitting…" : "Adopt & sign"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
