"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { DocumentSurface } from "@/components/signature/DocumentSurface";
import { DownloadSignedButton } from "@/components/signature/DownloadSignedButton";
import { SignWorkspace, type SignFieldView } from "@/components/signature/SignWorkspace";
import type { DocFileKind, Document, SignatureMark } from "@/lib/types";

type Payload = {
  document: {
    id: string;
    title: string;
    content: string;
    status: string;
    fileKind?: DocFileKind;
    fileDataUrl?: string;
    fileId?: string;
    fileName?: string;
    fields: SignFieldView[];
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
  canComplete?: boolean;
};

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [fullDoc, setFullDoc] = useState<Document | null>(null);
  const [canComplete, setCanComplete] = useState(false);
  const placeApi = useRef<{
    fillField: (fieldId: string) => Promise<void>;
    placeDateAt: (x: number, y: number, page?: number) => Promise<void>;
  } | null>(null);
  const onReady = useCallback(
    (api: {
      fillField: (fieldId: string) => Promise<void>;
      placeDateAt: (x: number, y: number, page?: number) => Promise<void>;
    }) => {
      placeApi.current = api;
    },
    [],
  );

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
        setCanComplete(Boolean(json.canComplete));
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
    <div className="sign-page mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Logo />
      <div className="sign-page-head">
        <h1 className="sign-page-title">{data.document.title}</h1>
        <p className="sign-page-meta">
          Signing as {data.recipient.name} ({data.recipient.email})
        </p>
        <p className="sign-page-hint">Tap Sign. Tap Add date, or tap the page where the date should go.</p>
      </div>

      <div className="sign-layout">
        <div className="sign-doc">
          <DocumentSurface
            content={data.document.content}
            fileKind={data.document.fileKind}
            fileDataUrl={data.document.fileDataUrl}
            fileId={data.document.fileId}
            fileAccess={params.token}
            fields={data.document.fields.map((f) => ({
              ...f,
              type: f.type as "signature" | "initials" | "date" | "text",
            }))}
            highlightPending={!done}
            interactive={!done}
            onPlace={
              done
                ? undefined
                : (x, y, page) => {
                    void placeApi.current?.placeDateAt(x, y, page);
                  }
            }
            onFieldSelect={
              done
                ? undefined
                : (fieldId) => {
                    void placeApi.current?.fillField(fieldId);
                  }
            }
          />
        </div>

        <div className="sign-sticky">
          <div className="panel sign-panel space-y-4 p-6">
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
              <SignWorkspace
                token={String(params.token)}
                recipientName={data.recipient.name}
                recipientEmail={data.recipient.email}
                preferredStyle={data.recipient.preferredSignatureStyle}
                document={data.document}
                initialCanComplete={canComplete}
                onReady={onReady}
                onFieldsChange={(fields, meta) => {
                  setCanComplete(meta.canComplete);
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          document: { ...prev.document, fields },
                          canComplete: meta.canComplete,
                        }
                      : prev,
                  );
                }}
                onCompleted={({ completed, fullDocument }) => {
                  setDone(true);
                  if (fullDocument) setFullDoc(fullDocument);
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          recipient: { ...prev.recipient, status: "signed" },
                          document: {
                            ...prev.document,
                            status: completed ? "completed" : prev.document.status,
                          },
                        }
                      : prev,
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
