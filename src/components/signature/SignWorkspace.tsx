"use client";

import { useEffect, useMemo, useState } from "react";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { SIGNING_TIME_ZONE, signerStamp } from "@/lib/signing-time";
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

function previewSignFields(
  fields: SignFieldView[],
  body: Record<string, unknown>,
  recipientName: string,
): SignFieldView[] | null {
  const fieldId = typeof body.fieldId === "string" ? body.fieldId : "";
  if (!fieldId || (body.action !== "move" && body.action !== "apply")) return null;
  return fields.map((field) => {
    if (field.id !== fieldId) return field;
    if (body.action === "move") {
      return {
        ...field,
        x: Number(body.x),
        y: Number(body.y),
        width: typeof body.width === "number" ? body.width : field.width,
        height: typeof body.height === "number" ? body.height : field.height,
      };
    }
    if (body.mode === "date") return { ...field, value: signerStamp() };
    const mark = body.signatureMark as SignatureMark | undefined;
    const text = (mark?.text || recipientName || "").trim();
    return {
      ...field,
      value: field.type === "initials" ? text.slice(0, 2).toUpperCase() || "IN" : text || "Signed",
      signature: mark || field.signature,
    };
  });
}

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
    fillField: (fieldId: string) => Promise<void>;
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

export function SignWorkspace({
  token,
  recipientName,
  preferredStyle = "elegant",
  document,
  initialCanComplete = false,
  selectedFieldId = null,
  onFieldsChange,
  onCompleted,
  onReady,
}: Props) {
  const [mark, setMark] = useState<SignatureMark | null>({
    mode: "typed",
    text: recipientName,
    style: preferredStyle,
  });
  const [selectedId] = useState<string | null>(selectedFieldId);
  const [editValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canComplete, setCanComplete] = useState(initialCanComplete);

  const fields = document.fields;
  const selected = useMemo(
    () => fields.find((f) => f.id === (selectedFieldId ?? selectedId)) || null,
    [fields, selectedFieldId, selectedId],
  );

  const canApplySignature =
    mark &&
    ((mark.mode === "typed" && !!mark.text?.trim()) ||
      (mark.mode === "image" && !!mark.imageDataUrl));

  async function sync(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const previous = document.fields;
    const preview = previewSignFields(previous, body, recipientName);
    if (preview) onFieldsChange(preview, { canComplete });
    try {
      const res = await fetch(`/api/sign/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, timeZone: SIGNING_TIME_ZONE }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (preview) onFieldsChange(previous, { canComplete });
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
      if (preview) onFieldsChange(previous, { canComplete });
      setError("Network error — changes were not saved");
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    onReady?.({
      fillField: async (fieldId: string) => {
        const field = document.fields.find((item) => item.id === fieldId);
        if (!field) return;
        if (field.type === "signature" || field.type === "initials") {
          if (!canApplySignature || !mark) {
            setError("Type your name or draw a signature, then tap the box again.");
            return;
          }
          await sync({ action: "apply", mode: "signature", fieldId, signatureMark: mark });
          return;
        }
        if (field.type === "date") {
          await sync({
            action: "apply",
            mode: "date",
            fieldId,
            signatureMark: { mode: "typed", style: mark?.style || preferredStyle },
          });
        }
      },
      placeDateAt: async (x, y, page) => {
        await sync({
          action: "apply",
          mode: "date",
          fieldId: selected?.type === "date" ? selected.id : undefined,
          signatureMark: { mode: "typed", style: mark?.style || preferredStyle },
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
  }, [selected?.id, selected?.type, editValue, mark, canApplySignature, document.fields, preferredStyle, onReady]);

  const nextSignature = fields.find(
    (field) =>
      (field.type === "signature" || field.type === "initials") &&
      !field.skipped &&
      !field.value &&
      !field.signature,
  );
  const nextDate = fields.find((field) => field.type === "date" && !field.skipped && !field.value);

  return (
    <div className="sign-workspace space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Sign this document</h2>
        <p className="mt-1 text-sm text-muted">
          Tap Sign, then Add date, or tap the page. Before Finish, drag a mark to move it, tap it to resize, or tap × to remove it.
        </p>
      </div>
      <SignaturePad defaultName={recipientName} value={mark} onChange={setMark} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !canApplySignature || !nextSignature}
          onClick={() => {
            if (nextSignature) void sync({ action: "apply", mode: "signature", fieldId: nextSignature.id, signatureMark: mark });
          }}
        >
          {busy ? "Saving…" : "Sign"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => {
            void sync({
              action: "apply",
              mode: "date",
              fieldId: nextDate?.id,
              signatureMark: { mode: "typed", style: mark?.style || preferredStyle },
            });
          }}
        >
          Add date
        </button>
      </div>
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      <button
        type="button"
        className="btn btn-accent w-full"
        disabled={busy || !canComplete}
        onClick={() => void sync({ action: "complete" })}
      >
        {busy ? "Finishing…" : canComplete ? "Finish" : "Sign to finish"}
      </button>
    </div>
  );
}

export type { PlaceMode };
