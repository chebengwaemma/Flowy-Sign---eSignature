"use client";

import { type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useState, useRef } from "react";
import type { DocFileKind, SignatureField, SignatureMark } from "@/lib/types";
import { FitSignatureText } from "@/components/signature/FitSignatureText";

type FieldView = Pick<
  SignatureField,
  "id" | "type" | "x" | "y" | "width" | "height" | "value" | "signature" | "skipped"
> & {
  signature?: SignatureMark;
};

/**
 * Renders the original document intact and overlays signature marks.
 * Never rewrites content / fileDataUrl — marks sit in an absolute layer only.
 */
export function DocumentSurface({
  content,
  fileKind = "text",
  fileDataUrl,
  fields,
  interactive = false,
  onPlace,
  onFieldSelect,
  onFieldMove,
  selectedFieldId,
  highlightPending = false,
  movableFieldTypes,
}: {
  content: string;
  fileKind?: DocFileKind;
  fileDataUrl?: string;
  fields: FieldView[];
  interactive?: boolean;
  onPlace?: (xPct: number, yPct: number) => void;
  onFieldSelect?: (fieldId: string) => void;
  /** Drag a mark to a new percent position (synced by parent). */
  onFieldMove?: (fieldId: string, xPct: number, yPct: number) => void;
  selectedFieldId?: string | null;
  highlightPending?: boolean;
  /** Field types that can be dragged. Default: signature, initials, date, text. */
  movableFieldTypes?: Array<FieldView["type"]>;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});
  const canMoveType = (type: FieldView["type"]) =>
    (movableFieldTypes || ["signature", "initials", "date", "text"]).includes(type);

  useEffect(() => {
    setDragPos((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const field = fields.find((f) => f.id === id);
        if (
          field &&
          Math.abs(field.x - next[id].x) < 0.35 &&
          Math.abs(field.y - next[id].y) < 0.35
        ) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fields]);

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (!interactive || !onPlace) return;
    if ((e.target as HTMLElement).closest(".doc-mark")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.min(88, Math.max(2, x)), Math.min(92, Math.max(2, y)));
  }

  function startFieldDrag(e: ReactPointerEvent<HTMLDivElement>, field: FieldView) {
    if (!onFieldMove || !canMoveType(field.type)) return;
    if ((e.target as HTMLElement).closest(".doc-mark-handle")) return;
    e.preventDefault();
    e.stopPropagation();

    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const width = field.width || 18;
    const height = Math.max(field.height || 7, 5);
    const originX = field.x;
    const originY = field.y;
    const startX = e.clientX;
    const startY = e.clientY;
    let lastX = originX;
    let lastY = originY;
    let moved = false;

    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) moved = true;
      lastX = Math.min(100 - width, Math.max(0, originX + dx));
      lastY = Math.min(100 - height, Math.max(0, originY + dy));
      setDragPos((prev) => ({ ...prev, [field.id]: { x: lastX, y: lastY } }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        target.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      if (moved) onFieldMove?.(field.id, lastX, lastY);
      else onFieldSelect?.(field.id);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={surfaceRef}
      className={`doc-surface ${interactive ? "is-interactive" : ""}`}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
    >
      <div className="doc-surface-original">
        {fileKind === "image" && fileDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileDataUrl} alt="Document" className="doc-surface-media" />
        ) : fileKind === "pdf" && fileDataUrl ? (
          <object data={fileDataUrl} type="application/pdf" className="doc-surface-pdf">
            <p className="p-4 text-sm text-muted">
              PDF preview unavailable in this browser. The original file is stored intact for download.
            </p>
            <pre className="whitespace-pre-wrap p-4 font-sans text-[15px] leading-7">{content}</pre>
          </object>
        ) : (
          <pre className="doc-surface-text">{content}</pre>
        )}
      </div>

      <div className="doc-surface-marks" aria-hidden={!fields.length}>
        {fields.map((field) => {
          const pending = !field.skipped && !field.value && !field.signature;
          if (pending && !highlightPending && !interactive && !onFieldSelect) return null;
          const w = field.width || 28;
          const h = Math.max(field.height || 8, 6);
          const live = dragPos[field.id];
          const markStyle: CSSProperties = {
            left: `${live?.x ?? field.x}%`,
            top: `${live?.y ?? field.y}%`,
            width: `${w}%`,
            height: `${h}%`,
          };
          const label = field.signature?.text || field.value || field.type;
          const selected = selectedFieldId === field.id;
          const movable = Boolean(onFieldMove && canMoveType(field.type));

          return (
            <div
              key={field.id}
              className={[
                "doc-mark",
                `doc-mark-${field.type}`,
                field.skipped ? "is-skipped" : pending ? "is-pending" : "is-signed",
                selected ? "is-selected" : "",
                onFieldSelect || movable ? "is-selectable" : "",
                movable ? "is-movable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={markStyle}
              onPointerDown={movable ? (e) => startFieldDrag(e, field) : undefined}
              onClick={
                onFieldSelect
                  ? (e) => {
                      e.stopPropagation();
                      onFieldSelect(field.id);
                    }
                  : undefined
              }
              role={onFieldSelect || movable ? "button" : undefined}
              tabIndex={onFieldSelect || movable ? 0 : undefined}
              title={movable ? "Drag to move" : undefined}
            >
              {field.skipped ? (
                <span className="doc-mark-plain">Skipped</span>
              ) : field.signature?.mode === "image" && field.signature.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={field.signature.imageDataUrl} alt="" className="doc-mark-img" />
              ) : field.type === "signature" || field.type === "initials" ? (
                pending ? (
                  <span className="doc-mark-plain">{field.type}</span>
                ) : (
                  <FitSignatureText text={label} style={field.signature?.style} maxPx={96} minPx={10} />
                )
              ) : (
                <FitSignatureText
                  text={field.value || field.type}
                  textClassName="sig-mark sig-fit-plain-text"
                  maxPx={28}
                  minPx={10}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
