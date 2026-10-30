"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  X,
  CircleHelp,
  Upload,
  LayoutTemplate,
  Cloud,
  HardDrive,
  MoreHorizontal,
  FileUp,
  FileText,
  UserRound,
  Type,
  Check,
  GripVertical,
  Trash2,
  Plus,
} from "lucide-react";
import type { SignatureStyle } from "@/lib/types";
import { ESignatureGenerator } from "@/components/signature/ESignatureGenerator";

type Step = 0 | 1 | 2 | 3;

type SelectedDoc = {
  id: string;
  name: string;
  sizeLabel: string;
  content: string;
  fileKind: "text" | "image" | "pdf";
  fileDataUrl?: string;
  fileName?: string;
};

type Signer = {
  id: string;
  name: string;
  email: string;
  color: string;
  signatureStyle: SignatureStyle;
};

type Field = {
  id: string;
  type: "signature" | "date" | "initials" | "text";
  signerId: string;
  x: number;
  y: number;
};

const STEPS = [
  { key: "docs", label: "Select documents", Icon: FileText },
  { key: "signers", label: "Add signers", Icon: UserRound },
  { key: "fields", label: "Place fields", Icon: Type },
  { key: "review", label: "Review and send", Icon: Check },
] as const;

const SIGNER_COLORS = ["#1fa97a", "#ff6b35", "#3b82f6", "#a855f7", "#e6a817"];

const DEFAULT_CONTENT = `SERVICE AGREEMENT

This agreement sets forth the terms between the parties.

1. Services
Provider will deliver the services described herein.

2. Fees
Fees are due as invoiced.

3. Signatures
By signing below, each party agrees to these terms.`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function SendWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [docs, setDocs] = useState<SelectedDoc[]>([]);
  const [signers, setSigners] = useState<Signer[]>([
    { id: uid(), name: "", email: "", color: SIGNER_COLORS[0], signatureStyle: "elegant" },
  ]);
  const [fields, setFields] = useState<Field[]>([]);
  const [activeSigner, setActiveSigner] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fieldTool, setFieldTool] = useState<Field["type"]>("signature");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [message, setMessage] = useState("");

  const canNext = useMemo(() => {
    if (step === 0) return docs.length > 0;
    if (step === 1)
      return signers.every((s) => s.name.trim() && s.email.includes("@")) && signers.length > 0;
    if (step === 2) return fields.some((f) => f.type === "signature");
    return true;
  }, [step, docs, signers, fields]);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: SelectedDoc[] = [];
    for (const file of Array.from(fileList)) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || file.name;
      if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
        if (file.size > 4 * 1024 * 1024) {
          setError("Images must be under 4 MB");
          continue;
        }
        const fileDataUrl = await readFileAsDataUrl(file);
        next.push({
          id: uid(),
          name: baseName,
          sizeLabel: formatBytes(file.size),
          content: `[Image document: ${file.name}]`,
          fileKind: "image",
          fileDataUrl,
          fileName: file.name,
        });
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        if (file.size > 4 * 1024 * 1024) {
          setError("PDFs must be under 4 MB");
          continue;
        }
        const fileDataUrl = await readFileAsDataUrl(file);
        next.push({
          id: uid(),
          name: baseName,
          sizeLabel: formatBytes(file.size),
          content: `[PDF document: ${file.name}]\n\nOriginal PDF is stored intact. Place signature fields on the preview page.`,
          fileKind: "pdf",
          fileDataUrl,
          fileName: file.name,
        });
      } else {
        let content = DEFAULT_CONTENT;
        if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
          content = await file.text();
        }
        next.push({
          id: uid(),
          name: baseName,
          sizeLabel: formatBytes(file.size),
          content,
          fileKind: "text",
          fileName: file.name,
        });
      }
    }
    if (next.length) setDocs((prev) => [...prev, ...next]);
  }

  function addSampleDoc() {
    setDocs((prev) => [
      ...prev,
      {
        id: uid(),
        name: "Service Agreement",
        sizeLabel: "24 KB",
        content: DEFAULT_CONTENT,
        fileKind: "text",
      },
    ]);
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function placeField(e: React.MouseEvent<HTMLDivElement>) {
    if (step !== 2 || !signers[activeSigner]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFields((prev) => [
      ...prev,
      {
        id: uid(),
        type: fieldTool,
        signerId: signers[activeSigner].id,
        x: Math.min(88, Math.max(2, x)),
        y: Math.min(92, Math.max(2, y)),
      },
    ]);
  }

  async function sendDocument() {
    setLoading(true);
    setError("");
    setUpgradeNeeded(false);
    const primary = docs[0];
    const signerIndex = (signerId: string) => signers.findIndex((s) => s.id === signerId);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: primary?.name || "Signature request",
        content: docs.map((d) => d.content).join("\n\n---\n\n"),
        fileKind: primary?.fileKind || "text",
        fileDataUrl: primary?.fileDataUrl,
        fileName: primary?.fileName,
        send: true,
        recipients: signers.map((s) => ({
          name: s.name.trim(),
          email: s.email.trim(),
          preferredSignatureStyle: s.signatureStyle,
        })),
        fields: fields.map((f) => ({
          type: f.type,
          signerIndex: Math.max(0, signerIndex(f.signerId)),
          x: f.x,
          y: f.y,
          width: f.type === "signature" ? 28 : 18,
          height: f.type === "signature" ? 10 : 6,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      if (data?.code === "PLAN_REQUIRED" || data?.code === "SIGNATURE_LIMIT") {
        setError(data?.error || "Buy a plan to send signatures.");
        setUpgradeNeeded(true);
      } else {
        setError(data?.error || "Could not send");
        setUpgradeNeeded(false);
      }
      return;
    }
    const docId = data?.document?.id;
    if (!docId) {
      setError("Document created but response was incomplete.");
      return;
    }
    router.push(`/documents/${docId}`);
    router.refresh();
  }

  return (
    <div className="send-wizard">
      <header className="send-top">
        <Link href="/dashboard" className="send-close" aria-label="Close">
          <X size={18} />
          <span>Send for signature</span>
        </Link>

        <nav className="send-steps" aria-label="Progress">
          {STEPS.map((s, i) => {
            const Icon = s.Icon;
            const active = step === i;
            const done = step > i;
            return (
              <button
                key={s.key}
                type="button"
                className={`send-step ${active ? "active" : ""} ${done ? "done" : ""}`}
                onClick={() => {
                  if (i < step || (i === step + 1 && canNext) || done) setStep(i as Step);
                }}
              >
                <span className="send-step-icon">
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </span>
                <span className="send-step-label">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="send-help" aria-label="Help">
          <CircleHelp size={18} />
        </button>
      </header>

      <main className="send-body">
        {step === 0 && (
          <section className="send-panel rise">
            <h1>Select documents to be signed</h1>

            <div className="send-sources">
              <button type="button" className="source-btn primary" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Upload
              </button>
              <button type="button" className="source-btn" onClick={addSampleDoc}>
                <LayoutTemplate size={16} /> Add template
              </button>
              <button
                type="button"
                className="source-btn"
                onClick={() => {
                  addSampleDoc();
                  setMessage("Cloud file added from Flowy Cloud (demo).");
                }}
              >
                <Cloud size={16} /> Cloud
              </button>
              <button
                type="button"
                className="source-btn"
                onClick={() => {
                  addSampleDoc();
                  setMessage("File imported from Google Drive (demo).");
                }}
              >
                <HardDrive size={16} /> Google Drive
              </button>
              <button type="button" className="source-btn icon-only" aria-label="More">
                <MoreHorizontal size={16} />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.gif,text/plain,application/pdf,image/*"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {message && <p className="send-note">{message}</p>}

            <div
              className={`send-drop ${dragging ? "active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="send-drop-icon">
                <FileUp size={28} />
              </div>
              <p>Drag documents here to upload</p>
            </div>

            <div className="selected-block">
              <h2>Selected documents</h2>
              <p className="selected-hint">Drag documents to reorder them.</p>
              {docs.length === 0 ? (
                <div className="selected-empty" />
              ) : (
                <ul className="selected-list">
                  {docs.map((doc) => (
                    <li key={doc.id}>
                      <GripVertical size={16} className="text-[#9aa3a0]" />
                      <FileText size={18} className="text-[#1fa97a]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#0b3d38]">{doc.name}</p>
                        <p className="text-xs text-[#5a736e]">{doc.sizeLabel}</p>
                      </div>
                      <button
                        type="button"
                        className="icon-quiet"
                        onClick={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="send-panel rise">
            <h1>Add signers</h1>
            <p className="send-sub">People who need to sign this request.</p>

            <div className="signer-list">
              {signers.map((signer, index) => (
                <article key={signer.id} className="signer-card">
                  <header className="signer-card-head">
                    <div className="signer-card-title">
                      <span className="signer-swatch" style={{ background: signer.color }} />
                      <span>Signer {index + 1}</span>
                    </div>
                    {signers.length > 1 && (
                      <button
                        type="button"
                        className="icon-quiet"
                        aria-label={`Remove signer ${index + 1}`}
                        onClick={() => setSigners((prev) => prev.filter((s) => s.id !== signer.id))}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </header>

                  <div className="signer-fields">
                    <label className="signer-field">
                      <span className="label">Full name</span>
                      <input
                        className="field"
                        placeholder="Jane Cooper"
                        value={signer.name}
                        autoComplete="name"
                        onChange={(e) =>
                          setSigners((prev) =>
                            prev.map((s) => (s.id === signer.id ? { ...s, name: e.target.value } : s)),
                          )
                        }
                      />
                    </label>
                    <label className="signer-field">
                      <span className="label">Email</span>
                      <input
                        className="field"
                        type="email"
                        placeholder="jane@company.com"
                        value={signer.email}
                        autoComplete="email"
                        onChange={(e) =>
                          setSigners((prev) =>
                            prev.map((s) => (s.id === signer.id ? { ...s, email: e.target.value } : s)),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="signer-style-block">
                    <ESignatureGenerator
                      name={signer.name}
                      style={signer.signatureStyle}
                      onStyleChange={(signatureStyle) =>
                        setSigners((prev) =>
                          prev.map((s) => (s.id === signer.id ? { ...s, signatureStyle } : s)),
                        )
                      }
                    />
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="source-btn signer-add-btn"
              onClick={() =>
                setSigners((prev) => [
                  ...prev,
                  {
                    id: uid(),
                    name: "",
                    email: "",
                    color: SIGNER_COLORS[prev.length % SIGNER_COLORS.length],
                    signatureStyle: "elegant",
                  },
                ])
              }
            >
              <Plus size={16} /> Add signer
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="send-panel fields-layout rise">
            <div>
              <h1>Place fields</h1>
              <p className="send-sub">Click the document to place fields for the selected signer.</p>
              <div className="field-tools">
                {(["signature", "initials", "date", "text"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`source-btn ${fieldTool === t ? "primary" : ""}`}
                    onClick={() => setFieldTool(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="signer-pills">
                {signers.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`signer-pill ${activeSigner === i ? "active" : ""}`}
                    onClick={() => setActiveSigner(i)}
                  >
                    <span className="signer-swatch sm" style={{ background: s.color }} />
                    {s.name || `Signer ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="doc-canvas" onClick={placeField}>
              {docs[0]?.fileKind === "image" && docs[0].fileDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={docs[0].fileDataUrl} alt="" className="doc-canvas-media" />
              ) : docs[0]?.fileKind === "pdf" && docs[0].fileDataUrl ? (
                <object data={docs[0].fileDataUrl} type="application/pdf" className="doc-canvas-pdf">
                  <pre>{docs[0].content}</pre>
                </object>
              ) : (
                <pre>{docs[0]?.content || DEFAULT_CONTENT}</pre>
              )}
              {fields.map((f) => {
                const signer = signers.find((s) => s.id === f.signerId);
                return (
                  <button
                    key={f.id}
                    type="button"
                    className="placed-field"
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      borderColor: signer?.color,
                      background: `${signer?.color}22`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFields((prev) => prev.filter((x) => x.id !== f.id));
                    }}
                    title="Click to remove"
                  >
                    {f.type}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="send-panel rise">
            <h1>Review and send</h1>
            <p className="send-sub">Confirm details before sending signature requests.</p>
            <div className="review-grid">
              <div className="review-card">
                <h3>Documents</h3>
                <ul>
                  {docs.map((d) => (
                    <li key={d.id}>{d.name}</li>
                  ))}
                </ul>
              </div>
              <div className="review-card">
                <h3>Signers</h3>
                <ul>
                  {signers.map((s) => (
                    <li key={s.id}>
                      {s.name} · {s.email}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="review-card">
                <h3>Fields</h3>
                <p>{fields.length} field(s) placed on document</p>
              </div>
            </div>
            {error && (
              <div className="send-error space-y-2">
                <p>{error}</p>
                {upgradeNeeded && (
                  <Link href="/billing" className="btn btn-primary inline-flex">
                    View packages & buy
                  </Link>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="send-footer">
        <div>
          {step > 0 && (
            <button type="button" className="source-btn" onClick={() => setStep((s) => (s - 1) as Step)}>
              Back
            </button>
          )}
        </div>
        {step < 3 ? (
          <button
            type="button"
            className="send-next"
            disabled={!canNext}
            onClick={() => setStep((s) => (s + 1) as Step)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="send-next ready" disabled={loading} onClick={sendDocument}>
            {loading ? "Sending…" : "Send for signature"}
          </button>
        )}
      </footer>
    </div>
  );
}
