"use client";

import { useEffect, useMemo, useState } from "react";
import { SignaturePad } from "@/components/signature/SignaturePad";
import type { DocFileKind, Document, SignatureMark } from "@/lib/types";

export type SignFieldView = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
  value?: string;
  signature?: SignatureMark;
  skipped?: boolean;
};

type PlaceMode = "signature" | "signature_and_date" | "date";

type Props = {
  token: string;
  recipientName: string;
  recipientEmail: string;
  preferredStyle?: SignatureMark["style"];
  document: {
    id: string;
    title: string;
    content: string;
    status: string;
    fileKind?: DocFileKind;
    fileDataUrl?: string;
    fields: SignFieldView[];
  };
  initialCanComplete?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string | null) => void;
  onFieldsChange: (fields: SignFieldView[], meta: { canComplete: boolean }) => void;
  onCompleted: (payload: { completed: boolean; fullDocument?: Document | null }) => void;
  onModeChange?: (mode: PlaceMode) => void;
  /** Imperative helpers for document preview (click-to-place / drag-to-move). */
  onReady?: (api: {
    placeDateAt: (xPct: number, yPct: number, page?: number) => Promise<void>;
    moveField: (
      fieldId: string,
      xPct: number,
      yPct: number,
      width?: number,
      height?: number,
    ) => Promise<void>;
    cutField: (fieldId: string) => Promise<void>;
  }) => void;
};

const MODES: Array<{ id: PlaceMode; title: string; blurb: string; required?: boolean }> = [
  {
    id: "signature",
    title: "1. Place signature",
    blurb: "Required — places your signature in the font you chose. You can finish and download without a date.",
    required: true,
  },
  {
    id: "signature_and_date",
    title: "2. Signature + date",
    blurb: "Optional — the date uses the same font as your signature.",
  },
  {
    id: "date",
    title: "3. Place date",
    blurb: "Optional — the date uses your signature font. Skip it and you can still download.",
  },
];

export function SignWorkspace({
  token,
  recipientName,
  preferredStyle = "elegant",
  document,
  initialCanComplete = false,
  selectedFieldId = null,
  onSelectField,
  onFieldsChange,
  onCompleted,
  onModeChange,
  onReady,
}: Props) {
  const [mark, setMark] = useState<SignatureMark | null>({
    mode: "typed",
    text: recipientName,
    style: preferredStyle,
  });
  const [mode, setMode] = useState<PlaceMode>("signature");
  const [selectedId, setSelectedId] = useState<string | null>(selectedFieldId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canComplete, setCanComplete] = useState(initialCanComplete);

  const fields = document.fields;
  const selected = useMemo(
    () => fields.find((f) => f.id === (selectedFieldId ?? selectedId)) || null,
    [fields, selectedFieldId, selectedId],
  );

  function selectField(id: string | null) {
    setSelectedId(id);
    onSelectField?.(id);
  }

  const canApplySignature =
    mark &&
    ((mark.mode === "typed" && !!mark.text?.trim()) ||
      (mark.mode === "image" && !!mark.imageDataUrl));

  async function sync(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sign/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Could not sync with database");
        return null;
      }
      if (json.document?.fields) {
        const nextFields = json.document.fields as SignFieldView[];
        const nextCan = Boolean(json.canComplete);
        setCanComplete(nextCan);
        onFieldsChange(nextFields, { canComplete: nextCan });
      }
      if (body.action === "complete" && json.ok) {
        onCompleted({
          completed: Boolean(json.completed),
          fullDocument: json.fullDocument || null,
        });
      }
      return json;
    } catch {
      setError("Network error — changes were not saved");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function applyMode() {
    if (mode === "signature" || mode === "signature_and_date") {
      if (!canApplySignature || !mark) {
        setError("Create your signature first");
        return;
      }
      await sync({
        action: "apply",
        mode,
        fieldId: selectedFieldId || selectedId || undefined,
        signatureMark: mark,
      });
      return;
    }
    await sync({
      action: "apply",
      mode: "date",
      fieldId: selected?.type === "date" ? selected.id : undefined,
      value: editValue.trim() || undefined,
      signatureMark: { mode: "typed", style: mark?.style || preferredStyle, text: editValue.trim() || undefined },
    });
  }

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useEffect(() => {
    onReady?.({
      placeDateAt: async (x, y, page) => {
        await sync({
          action: "apply",
          mode: "date",
          fieldId: selected?.type === "date" ? selected.id : undefined,
          value: editValue.trim() || undefined,
          signatureMark: { mode: "typed", style: mark?.style || preferredStyle, text: editValue.trim() || undefined },
          x,
          y,
          page,
        });
      },
      moveField: async (fieldId, x, y, width, height) => {
        await sync({ action: "move", fieldId, x, y, width, height });
      },
      cutField: async (fieldId) => {
        await sync({ action: "cut", fieldId });
      },
    });
    // Re-bind when selection / date override changes so click-to-place stays accurate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.type, editValue, mark?.style, preferredStyle, onReady]);

  async function saveEdit() {
    if (!editingId) return;
    const field = fields.find((f) => f.id === editingId);
    if (!field) return;
    if (field.type === "signature" || field.type === "initials") {
      if (!canApplySignature || !mark) {
        setError("Signature required to edit");
        return;
      }
      await sync({
        action: "edit",
        fieldId: editingId,
        signatureMark: mark,
        value: mark.mode === "typed" ? mark.text : mark.text || recipientName,
      });
    } else {
      await sync({
        action: "edit",
        fieldId: editingId,
        value: editValue.trim(),
        signatureMark: { mode: "typed", style: mark?.style || preferredStyle, text: editValue.trim() },
      });
    }
    setEditingId(null);
  }

  return (
    <div className="sign-workspace space-y-5">
      <div>
        <h2 className="font-semibold text-lg">Signing modes</h2>
        <p className="mt-1 text-sm text-muted">
          The date uses the same font as your signature. Leave the date off and you can still download.
        </p>
      </div>

      <div className="sign-mode-grid" role="radiogroup" aria-label="Signing modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            className={`sign-mode-card ${mode === m.id ? "active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            <span className="sign-mode-title">
              {m.title}
              {m.required ? <em className="sign-mode-req">Required</em> : <em>Optional</em>}
            </span>
            <span className="sign-mode-blurb">{m.blurb}</span>
          </button>
        ))}
      </div>

      {(mode === "signature" || mode === "signature_and_date") && (
        <div className="space-y-3">
          <h3 className="font-semibold">Your signature</h3>
          <SignaturePad defaultName={recipientName} value={mark} onChange={setMark} />
        </div>
      )}

      {mode === "date" && (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="label">Date value (optional override)</span>
            <input
              className="field"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Leave blank to use today’s date"
            />
          </label>
          <p className="text-xs text-muted">
            Click the document to place the date. Drag a signature or date on the page to move it.
          </p>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={busy || ((mode === "signature" || mode === "signature_and_date") && !canApplySignature)}
        onClick={() => void applyMode()}
      >
        {busy
          ? "Saving…"
          : mode === "signature"
            ? "Place signature"
            : mode === "signature_and_date"
              ? "Place signature + date"
              : "Place date"}
      </button>

      <div className="sign-field-list">
        <h3 className="font-semibold">Fields on this document</h3>
        <p className="text-sm text-muted mb-2">Drag a signature or date to move it. Drag a corner to make it smaller or bigger.</p>
        <ul className="space-y-2">
          {fields.map((f) => {
            const filled = !f.skipped && !!(f.value || f.signature);
            const isSig = f.type === "signature" || f.type === "initials";
            return (
              <li
                key={f.id}
                className={`sign-field-row ${(selectedFieldId || selectedId) === f.id ? "active" : ""}`}
              >
                <button type="button" className="sign-field-main" onClick={() => selectField(f.id)}>
                  <strong className="capitalize">{f.type}</strong>
                  <span>
                    {f.skipped
                      ? "Skipped"
                      : filled
                        ? f.signature?.text || f.value || "Filled"
                        : "Waiting"}
                  </span>
                  {isSig && !f.skipped ? (
                    <em className="sign-field-tag">Required*</em>
                  ) : (
                    <em className="sign-field-tag">Optional</em>
                  )}
                </button>
                <div className="sign-field-actions">
                  <button
                    type="button"
                    className="source-btn"
                    disabled={busy}
                    onClick={() => {
                      selectField(f.id);
                      setEditingId(f.id);
                      setEditValue(f.value || "");
                      if (isSig) setMode("signature");
                      else setMode("date");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="source-btn"
                    disabled={busy}
                    onClick={() => void sync({ action: "delete", fieldId: f.id })}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="source-btn"
                    disabled={busy}
                    onClick={() => void sync({ action: "skip", fieldId: f.id })}
                  >
                    Skip
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {fields.length === 0 && (
          <p className="text-sm text-muted">No fields were assigned to you on this document.</p>
        )}
      </div>

      {editingId && (
        <div className="sign-edit-box space-y-3">
          <h3 className="font-semibold">Edit field</h3>
          {(fields.find((f) => f.id === editingId)?.type === "signature" ||
            fields.find((f) => f.id === editingId)?.type === "initials") && (
            <SignaturePad defaultName={recipientName} value={mark} onChange={setMark} />
          )}
          {fields.find((f) => f.id === editingId)?.type === "date" && (
            <input
              className="field"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Date text"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-accent" disabled={busy} onClick={() => void saveEdit()}>
              Save to database
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      <button
        type="button"
        className="btn btn-accent w-full"
        disabled={busy || !canComplete}
        onClick={() => void sync({ action: "complete" })}
      >
        {busy ? "Finishing…" : canComplete ? "Finish signing" : "Place required signature to finish"}
      </button>
      <p className="text-xs text-muted">
        * At least one signature must be placed. You can skip extra signature fields only when another remains.
        Date fields are optional.
      </p>
    </div>
  );
}

export type { PlaceMode };
