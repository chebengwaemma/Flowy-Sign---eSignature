"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { PdfPageStack } from "@/components/signature/PdfPageStack";
import { takeUploads } from "@/lib/pending-uploads";

type Step = 0 | 1 | 2 | 3;

type SelectedDoc = {
  id: string;
  name: string;
  sizeLabel: string;
  content: string;
  fileKind: "text" | "image" | "pdf";
  size: number;
  previewUrl?: string;
  localFile?: File;
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
  docId: string;
  type: "signature" | "date" | "initials" | "text";
  signerId: string;
  x: number;
  y: number;
  /** Percent of the real document page */
  width: number;
  height: number;
  page?: number;
};

const DEFAULT_FIELD_SIZE: Record<Field["type"], { width: number; height: number }> = {
  signature: { width: 28, height: 10 },
  initials: { width: 12, height: 8 },
  date: { width: 20, height: 8 },
  text: { width: 22, height: 7 },
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

const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

async function uploadLocalFile(file: File) {
  const uploadId = uid() + uid();
  const chunkSize = 2 * 1024 * 1024;
  const total = Math.max(1, Math.ceil(file.size / chunkSize));
  const mime =
    file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
  for (let index = 0; index < total; index++) {
    const slice = file.slice(index * chunkSize, index * chunkSize + chunkSize);
    const data = bytesToBase64(new Uint8Array(await slice.arrayBuffer()));
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, index, total, fileName: file.name, mime, data }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Upload failed");
  }
  const done = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, finalize: true, total, fileName: file.name, mime }),
  });
  const saved = await done.json().catch(() => ({}));
  if (!done.ok || !saved.fileId) throw new Error(saved.error || "Upload failed");
  return saved.fileId as string;
}

function makeSigner(index: number, name: string, email: string): Signer {
  return {
    id: uid(),
    name,
    email,
    color: SIGNER_COLORS[index % SIGNER_COLORS.length],
    signatureStyle: "elegant",
  };
}

export function SendWizard({
  accountEmail,
  accountName,
  signerLimit,
  savedSigners: savedSignersProp,
  signersLocked,
}: {
  accountEmail: string;
  accountName: string;
  signerLimit: number;
  savedSigners: { name: string; email: string }[];
  signersLocked: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [docs, setDocs] = useState<SelectedDoc[]>([]);
  const [savedSigners, setSavedSigners] = useState(savedSignersProp);
  const [emailsLocked, setEmailsLocked] = useState(signerLimit <= 1 || signersLocked);
  const [locking, setLocking] = useState(false);
  const [signers, setSigners] = useState<Signer[]>(() => {
    if (signerLimit <= 1) return [makeSigner(0, accountName, accountEmail)];
    if (signersLocked && savedSignersProp.length) {
      return savedSignersProp.slice(0, signerLimit).map((slot, index) => makeSigner(index, slot.name, slot.email));
    }
    return Array.from({ length: signerLimit }, (_, index) =>
      makeSigner(index, index === 0 ? accountName : "", index === 0 ? accountEmail : ""),
    );
  });
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
    if (step === 1) {
      if (signerLimit <= 1) return (signers[0]?.name.trim().length || 0) > 0;
      if (!emailsLocked) {
        const slots = signers.slice(0, signerLimit);
        if (slots.length < signerLimit) return false;
        const emails = slots.map((s) => s.email.trim().toLowerCase());
        if (emails.some((email) => !email.includes("@"))) return false;
        if (new Set(emails).size !== emails.length) return false;
        return slots.every((s) => s.name.trim().length > 0);
      }
      const picked = signers.filter((s) => s.email.trim());
      if (!picked.length) return false;
      const emails = picked.map((s) => s.email.trim().toLowerCase());
      if (new Set(emails).size !== emails.length) return false;
      const allowed = new Set(savedSigners.map((s) => s.email.toLowerCase()));
      return picked.every((s) => s.name.trim() && allowed.has(s.email.trim().toLowerCase()));
    }
    if (step === 2)
      return docs.every((doc) => fields.some((f) => f.docId === doc.id && f.type === "signature"));
    return true;
  }, [step, docs, signers, fields, signerLimit, emailsLocked, savedSigners]);

  const nextHint = useMemo(() => {
    if (canNext) return "";
    if (step === 0) return "Upload a document to continue.";
    if (step === 1) {
      if (signerLimit <= 1) return "Enter your name. The account email is locked.";
      if (!emailsLocked) {
        return `Enter a name and a different email in all ${signerLimit} slots. They lock when you continue.`;
      }
      return "Choose one of the locked emails for each signer.";
    }
    if (step === 2) return "Place at least one signature field on every document.";
    return "";
  }, [canNext, step, signerLimit, emailsLocked]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const tookUploads = useRef(false);
  useEffect(() => {
    if (tookUploads.current) return;
    tookUploads.current = true;
    const files = takeUploads();
    if (!files.length) return;
    const list = new DataTransfer();
    for (const file of files) list.items.add(file);
    void addFiles(list.files);
    // One-shot handoff from the dashboard dropzone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: SelectedDoc[] = [];
    for (const file of Array.from(fileList)) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || file.name;
      if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setError("Images must be under 80 MB");
          continue;
        }
        next.push({
          id: uid(),
          name: baseName,
          sizeLabel: formatBytes(file.size),
          size: file.size,
          content: `[Image document: ${file.name}]`,
          fileKind: "image",
          previewUrl: URL.createObjectURL(file),
          localFile: file,
          fileName: file.name,
        });
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setError("PDFs must be under 80 MB. Compress the file and try again.");
          continue;
        }
        next.push({
          id: uid(),
          name: baseName,
          sizeLabel: formatBytes(file.size),
          size: file.size,
          content: `[PDF document: ${file.name}]`,
          fileKind: "pdf",
          previewUrl: URL.createObjectURL(file),
          localFile: file,
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
          size: file.size,
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
        size: 24_000,
        content: DEFAULT_CONTENT,
        fileKind: "text",
      },
    ]);
  }

  function placeAt(docId: string, page: number, xPct: number, yPct: number) {
    if (!signers[activeSigner] || !docId) return;
    const size = DEFAULT_FIELD_SIZE[fieldTool];
    const x = xPct - size.width / 2;
    const y = yPct - size.height / 2;
    setFields((prev) => [
      ...prev,
      {
        id: uid(),
        docId,
        type: fieldTool,
        signerId: signers[activeSigner].id,
        page,
        x: Math.min(100 - size.width, Math.max(0, x)),
        y: Math.min(100 - size.height, Math.max(0, y)),
        width: size.width,
        height: size.height,
      },
    ]);
  }

  function placeField(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest(".placed-field")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    placeAt(e.currentTarget.dataset.doc || "", Number(e.currentTarget.dataset.page || 1), x, y);
  }

  function startResize(
    e: React.PointerEvent,
    fieldId: string,
    corner: "se" | "sw" | "ne" | "nw",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const pageEl = (e.currentTarget as HTMLElement).closest(".doc-page") as HTMLElement | null;
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { ...field };
    const minW = 8;
    const minH = 4;

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      let x = origin.x;
      let y = origin.y;
      let width = origin.width;
      let height = origin.height;

      if (corner.includes("e")) width = origin.width + dx;
      if (corner.includes("w")) width = origin.width - dx;
      if (corner.includes("s")) height = origin.height + dy;
      if (corner.includes("n")) height = origin.height - dy;
      width = Math.min(70, Math.max(minW, width));
      height = Math.min(40, Math.max(minH, height));
      if (corner.includes("w")) x = origin.x + origin.width - width;
      if (corner.includes("n")) y = origin.y + origin.height - height;

      x = Math.min(100 - width, Math.max(0, x));
      y = Math.min(100 - height, Math.max(0, y));

      setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, x, y, width, height } : f)));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startMove(e: React.PointerEvent, fieldId: string) {
    if ((e.target as HTMLElement).closest(".placed-field-handle")) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const pageEl = el.closest(".doc-page") as HTMLElement | null;
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { x: field.x, y: field.y, width: field.width, height: field.height };
    el.setPointerCapture?.(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      const x = Math.min(100 - origin.width, Math.max(0, origin.x + dx));
      const y = Math.min(100 - origin.height, Math.max(0, origin.y + dy));
      setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, x, y } : f)));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function goNext() {
    if (!canNext || locking) return;
    if (step === 1 && signerLimit > 1 && !emailsLocked) {
      setLocking(true);
      setError("");
      const payload = signers.slice(0, signerLimit).map((s) => ({
        name: s.name.trim(),
        email: s.email.trim(),
      }));
      try {
        const res = await fetch("/api/account/device-signers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signers: payload }),
        });
        const data = await res.json().catch(() => ({}));
        const saved = Array.isArray(data?.signers) ? data.signers : [];
        if (!res.ok || saved.length < signerLimit) {
          setError(data?.error || "Could not lock the device emails.");
          setLocking(false);
          return;
        }
        const nextSaved = saved.slice(0, signerLimit).map((slot: { name?: string; email?: string }) => ({
          name: String(slot?.name || "").trim(),
          email: String(slot?.email || "").trim().toLowerCase(),
        }));
        setSavedSigners(nextSaved);
        setEmailsLocked(true);
        setSigners(nextSaved.map((slot: { name: string; email: string }, index: number) => makeSigner(index, slot.name, slot.email)));
      } catch {
        setError("Could not lock the device emails.");
        setLocking(false);
        return;
      }
      setLocking(false);
    }
    setStep((s) => (s + 1) as Step);
  }

  async function sendDocument() {
    setLoading(true);
    setError("");
    setUpgradeNeeded(false);
    const recipients = signers.slice(0, signerLimit).flatMap((s) => {
      const email = (signerLimit <= 1 ? accountEmail : s.email).trim();
      const name = s.name.trim();
      if (!email || !name) return [];
      return [{ id: s.id, name, email, preferredSignatureStyle: s.signatureStyle }];
    });
    const signerIndex = (signerId: string) => recipients.findIndex((s) => s.id === signerId);
    const made: string[] = [];
    for (const doc of docs) {
      let fileId: string | undefined;
      if (doc.localFile) {
        try {
          fileId = await uploadLocalFile(doc.localFile);
        } catch (err) {
          setLoading(false);
          setError(err instanceof Error ? err.message : "Upload failed");
          return;
        }
      }
      const docFields = fields.filter((f) => f.docId === doc.id);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.name || "Signature request",
          content: doc.content,
          fileKind: doc.fileKind,
          fileId,
          fileName: doc.fileName,
          send: true,
          recipients: recipients.map((s) => ({
            name: s.name,
            email: s.email,
            preferredSignatureStyle: s.preferredSignatureStyle,
          })),
          fields: docFields.flatMap((f) => {
            const signerIndexValue = signerIndex(f.signerId);
            if (signerIndexValue < 0) return [];
            return [{
              type: f.type,
              signerIndex: signerIndexValue,
              x: f.x,
              y: f.y,
              width: f.width,
              height: f.height,
              page: f.page || 1,
            }];
          }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        const why = data?.error || "Could not send";
        setUpgradeNeeded(data?.code === "PLAN_REQUIRED" || data?.code === "SIGNATURE_LIMIT");
        setError(made.length ? `${made.length} sent. “${doc.name}” failed: ${why}` : why);
        return;
      }
      if (data?.document?.id) made.push(data.document.id);
    }
    setLoading(false);
    if (!made.length) {
      setError("Document created but response was incomplete.");
      return;
    }
    router.push(made.length === 1 ? `/documents/${made[0]}` : "/dashboard");
    router.refresh();
  }

  function placedFields(docId: string, page: number) {
    return fields
      .filter((f) => f.docId === docId && (f.page || 1) === page)
      .map((f) => {
        const signer = signers.find((s) => s.id === f.signerId);
        return (
          <div
            key={f.id}
            className="placed-field"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              width: `${f.width}%`,
              height: `${f.height}%`,
              borderColor: signer?.color,
              background: `${signer?.color}22`,
            }}
            onPointerDown={(e) => startMove(e, f.id)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setFields((prev) => prev.filter((x) => x.id !== f.id));
            }}
            title="Drag to move. Drag a corner to make the signature or date smaller or bigger. Double-click to remove."
          >
            <span className="placed-field-label">{f.type}</span>
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <span
                key={corner}
                className={`placed-field-handle handle-${corner}`}
                onPointerDown={(e) => startResize(e, f.id, corner)}
              />
            ))}
          </div>
        );
      });
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

      <main className="send-body" ref={bodyRef}>
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
                onChange={(e) => {
                  void addFiles(e.target.files);
                  e.target.value = "";
                }}
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
                        onClick={() => {
                          setDocs((prev) => prev.filter((d) => d.id !== doc.id));
                          setFields((prev) => prev.filter((f) => f.docId !== doc.id));
                        }}
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
            <p className="send-sub">
              {signerLimit <= 1
                ? "This plan is 1 device. Only your account email can be used, and it cannot be changed."
                : emailsLocked
                  ? `These ${signerLimit} emails are locked. Pick them from the list. A new email cannot be added.`
                  : `This plan has ${signerLimit} email slots. Use your account email and any other emails. When you continue, these ${signerLimit} emails lock and cannot be changed.`}
            </p>
            {error ? <p className="send-error">{error}</p> : null}

            <div className="signer-list">
              {signers.map((signer, index) => {
                const choosing = signerLimit > 1 && emailsLocked;
                return (
                <article key={signer.id} className="signer-card">
                  <header className="signer-card-head">
                    <div className="signer-card-title">
                      <span className="signer-swatch" style={{ background: signer.color }} />
                      <span>Signer {index + 1}</span>
                    </div>
                    {choosing && signers.length > 1 && (
                      <button
                        type="button"
                        className="icon-quiet"
                        aria-label={`Remove signer ${index + 1}`}
                        onClick={() => {
                          setSigners((prev) => prev.filter((s) => s.id !== signer.id));
                          setFields((prev) => prev.filter((f) => f.signerId !== signer.id));
                        }}
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
                        readOnly={choosing}
                        onChange={(e) => {
                          if (choosing) return;
                          const name = e.target.value;
                          setSigners((prev) =>
                            prev.map((s) => (s.id === signer.id ? { ...s, name } : s)),
                          );
                        }}
                      />
                    </label>
                    <label className="signer-field">
                      <span className="label">Email</span>
                      {signerLimit <= 1 ? (
                        <input
                          className="field"
                          type="email"
                          value={accountEmail}
                          readOnly
                          aria-readonly="true"
                        />
                      ) : choosing ? (
                        <select
                          className="field"
                          value={signer.email}
                          onChange={(e) => {
                            const email = e.target.value;
                            const match = savedSigners.find((slot) => slot.email === email);
                            setSigners((prev) => {
                              const current = prev.find((s) => s.id === signer.id);
                              const other = prev.find((s) => s.id !== signer.id && s.email === email);
                              const displaced = savedSigners.find((slot) => slot.email === current?.email);
                              return prev.map((s) => {
                                if (s.id === signer.id) return { ...s, email, name: match?.name || s.name };
                                if (other && s.id === other.id && displaced) {
                                  return { ...s, email: displaced.email, name: displaced.name };
                                }
                                return s;
                              });
                            });
                          }}
                        >
                          {savedSigners.map((slot) => (
                            <option key={slot.email} value={slot.email}>
                              {slot.name} · {slot.email}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="field"
                          type="email"
                          placeholder="name@email.com"
                          value={signer.email}
                          autoComplete="off"
                          onChange={(e) => {
                            const email = e.target.value;
                            setSigners((prev) => prev.map((s) => (s.id === signer.id ? { ...s, email } : s)));
                          }}
                        />
                      )}
                      {signerLimit <= 1 ? (
                        <span className="signer-email-lock">Account email. Locked for this device.</span>
                      ) : choosing ? (
                        <span className="signer-email-lock">Locked email. Choose one of the saved {signerLimit}.</span>
                      ) : (
                        <span className="signer-email-lock">Slot {index + 1} of {signerLimit}. This locks when you continue.</span>
                      )}
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
                );
              })}
            </div>

            {signerLimit > 1 && emailsLocked && signers.length < savedSigners.length ? (
              <button
                type="button"
                className="source-btn signer-add-btn"
                onClick={() =>
                  setSigners((prev) => {
                    const taken = new Set(prev.map((s) => s.email.trim().toLowerCase()));
                    const next = savedSigners.find((slot) => !taken.has(slot.email));
                    if (!next || prev.length >= signerLimit) return prev;
                    return [...prev, makeSigner(prev.length, next.name, next.email)];
                  })
                }
              >
                <Plus size={16} /> Add signer
              </button>
            ) : null}
          </section>
        )}

        {step === 2 && (
          <section className="send-panel fields-layout rise">
            <div>
              <h1>Place fields</h1>
              <p className="send-sub">
                {docs.length === 1
                  ? "1 document uploaded. It is listed below. Click a page to place a field."
                  : `${docs.length} documents uploaded. Each one is listed below, in order. Click a name to jump to it, then click a page to place a field.`}
              </p>
              <div className="place-doc-picks" aria-label="Uploaded documents">
                {docs.map((doc, index) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      document.getElementById(`place-doc-${doc.id}`)?.scrollIntoView({ block: "start" })
                    }
                  >
                    {index + 1}. {doc.name}
                  </button>
                ))}
              </div>
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
            <div className="place-docs">
              {docs.map((doc, index) => (
                <section className="place-doc" id={`place-doc-${doc.id}`} key={doc.id}>
                  <div className="place-doc-head">
                    <span className="place-doc-index">{index + 1}/{docs.length}</span>
                    <h2>{doc.name}</h2>
                  </div>
                  <div className="doc-canvas doc-canvas-plain doc-scroll">
                    {doc.fileKind === "pdf" && doc.previewUrl ? (
                      <PdfPageStack
                        src={doc.previewUrl}
                        onPlace={(page, x, y) => placeAt(doc.id, page, x, y)}
                        renderOverlay={(page) => placedFields(doc.id, page)}
                      />
                    ) : (
                      <div className="doc-page" data-doc={doc.id} data-page={1} onClick={placeField}>
                        {doc.fileKind === "image" && doc.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doc.previewUrl} alt="" className="doc-page-media" />
                        ) : (
                          <pre className="doc-surface-text">{doc.content || DEFAULT_CONTENT}</pre>
                        )}
                        <div className="doc-page-marks">{placedFields(doc.id, 1)}</div>
                      </div>
                    )}
                  </div>
                </section>
              ))}
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
                  {signers.filter((s) => s.email.trim() && s.name.trim()).map((s) => (
                    <li key={s.id}>
                      {s.name} · {s.email}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="review-card">
                <h3>Fields</h3>
                <ul>
                  {docs.map((d) => (
                    <li key={d.id}>
                      {d.name}: {fields.filter((f) => f.docId === d.id).length} field(s)
                    </li>
                  ))}
                </ul>
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
          {nextHint ? <p className="send-next-hint">{nextHint}</p> : null}
        </div>
        {step < 3 ? (
          <button
            type="button"
            className="send-next"
            disabled={!canNext || locking}
            onClick={() => void goNext()}
          >
            {locking ? "Locking emails…" : "Next"}
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
