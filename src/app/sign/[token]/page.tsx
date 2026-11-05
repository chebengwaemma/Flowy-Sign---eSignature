"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { DocumentSurface } from "@/components/signature/DocumentSurface";
import { DownloadSignedButton } from "@/components/signature/DownloadSignedButton";
import {
  SignWorkspace,
  type PlaceMode,
  type SignFieldView,
} from "@/components/signature/SignWorkspace";
import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [canComplete, setCanComplete] = useState(false);
  const [signMode, setSignMode] = useState<PlaceMode>("signature");
  const placeApi = useRef<{
    placeDateAt: (x: number, y: number, page?: number) => Promise<void>;
    moveField: (fieldId: string, x: number, y: number, width?: number, height?: number) => Promise<void>;
    cutField: (fieldId: string) => Promise<void>;
  } | null>(null);
  const onModeChange = useCallback((mode: PlaceMode) => setSignMode(mode), []);
  const onReady = useCallback(
    (api: {
      placeDateAt: (x: number, y: number, page?: number) => Promise<void>;
      moveField: (fieldId: string, x: number, y: number, width?: number, height?: number) => Promise<void>;
      cutField: (fieldId: string) => Promise<void>;
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
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 app-meet-page">
      <ScrollMeetSplit className="app-meet-stack" itemClassName="app-meet-item" distance={90} stagger={0.1}>
        <Logo />
        <div>
          <h1 className="display mt-8 text-4xl">{data.document.title}</h1>
          <p className="mt-2 text-muted">
            Signing as {data.recipient.name} ({data.recipient.email})
          </p>
          <p className="mt-1 text-sm text-muted">
            Your signature font is also used for the date. You can download with no date.
          </p>
        </div>
      </ScrollMeetSplit>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <ScrollMeetBlock side="left" distance={110} className="app-meet-block">
          <DocumentSurface
            content={data.document.content}
            fileKind={data.document.fileKind}
            fileDataUrl={data.document.fileDataUrl}
            fields={data.document.fields.map((f) => ({
              ...f,
              type: f.type as "signature" | "initials" | "date" | "text",
            }))}
            highlightPending={!done}
            selectedFieldId={selectedFieldId}
            onFieldSelect={done ? undefined : setSelectedFieldId}
            interactive={!done && signMode === "date"}
            onPlace={
              !done && signMode === "date"
                ? (x, y, page) => {
                    void placeApi.current?.placeDateAt(x, y, page);
                  }
                : undefined
            }
            onFieldMove={
              done
                ? undefined
                : (fieldId, x, y, size) => {
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            document: {
                              ...prev.document,
                              fields: prev.document.fields.map((f) =>
                                f.id === fieldId
                                  ? { ...f, x, y, ...(size ? { width: size.width, height: size.height } : {}) }
                                  : f,
                              ),
                            },
                          }
                        : prev,
                    );
                    void placeApi.current?.moveField(fieldId, x, y, size?.width, size?.height);
                  }
            }
            movableFieldTypes={["signature", "initials", "date", "text"]}
            onFieldCut={
              done
                ? undefined
                : (fieldId) => {
                    setData((prev) => {
                      if (!prev) return prev;
                      const fields = prev.document.fields;
                      const target = fields.find((f) => f.id === fieldId);
                      const otherSigs = fields.filter(
                        (f) =>
                          f.id !== fieldId &&
                          (f.type === "signature" || f.type === "initials"),
                      );
                      const nextFields =
                        target &&
                        (target.type === "signature" || target.type === "initials") &&
                        otherSigs.length === 0
                          ? fields.map((f) =>
                              f.id === fieldId
                                ? { ...f, value: undefined, signature: undefined, skipped: false }
                                : f,
                            )
                          : fields.filter((f) => f.id !== fieldId);
                      return {
                        ...prev,
                        document: { ...prev.document, fields: nextFields },
                      };
                    });
                    void placeApi.current?.cutField(fieldId);
                  }
            }
          />
        </ScrollMeetBlock>

        <ScrollMeetBlock side="right" distance={120} className="app-meet-block">
          <div className="panel space-y-4 p-6">
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
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onModeChange={onModeChange}
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
        </ScrollMeetBlock>
      </div>
    </div>
  );
}
