"use client";

import { type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useState, useRef } from "react";
import type { DocFileKind, SignatureField, SignatureMark } from "@/lib/types";
import { FitSignatureText } from "@/components/signature/FitSignatureText";
import { PdfPageStack } from "@/components/signature/PdfPageStack";
import { loadStoredFileUrl } from "@/lib/load-stored-file";

type FieldView = Pick<
  SignatureField,
  "id" | "type" | "x" | "y" | "width" | "height" | "value" | "signature" | "skipped"
> & {
  page?: number;
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
  fileId,
  fileAccess,
  fields,
  interactive = false,
  onPlace,
  onFieldSelect,
  onFieldMove,
  onFieldCut,
  selectedFieldId,
  highlightPending = false,
  movableFieldTypes,
}: {
  content: string;
  fileKind?: DocFileKind;
  fileDataUrl?: string;
  fileId?: string;
  /** Signer token, so a recipient can open a large file without an account */
  fileAccess?: string;
  fields: FieldView[];
  interactive?: boolean;
  onPlace?: (xPct: number, yPct: number, page?: number) => void;
  onFieldSelect?: (fieldId: string) => void;
  /** Drag a mark, or resize it from a corner. Size is sent when a corner handle is used. */
  onFieldMove?: (
    fieldId: string,
    xPct: number,
    yPct: number,
    size?: { width: number; height: number },
  ) => void;
  /** Cross button — cut a doubled signature or date off the page. */
  onFieldCut?: (fieldId: string) => void;
  selectedFieldId?: string | null;
  highlightPending?: boolean;
  /** Field types that can be dragged. Default: signature, initials, date, text. */
  movableFieldTypes?: Array<FieldView["type"]>;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragPos, setDragPos] = useState<
    Record<string, { x: number; y: number; width?: number; height?: number }>
  >({});
  const canMoveType = (type: FieldView["type"]) =>
    (movableFieldTypes || ["signature", "initials", "date", "text"]).includes(type);

  useEffect(() => {
    if (!fileId || fileDataUrl) return;
    let cancelled = false;
    let created = "";
    setFileError("");
    setRemoteUrl("");
    loadStoredFileUrl(fileId, fileAccess)
      .then((url) => {
        created = url;
        if (cancelled) URL.revokeObjectURL(url);
        else setRemoteUrl(url);
      })
      .catch((err: Error) => {
        if (!cancelled) setFileError(err.message || "Could not open the file");
      });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [fileId, fileAccess, fileDataUrl]);

  useEffect(() => {
    setDragPos((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const field = fields.find((f) => f.id === id);
        const live = next[id];
        const sizeOk =
          live.width == null ||
          (field && Math.abs((field.width || 0) - live.width) < 0.35 && Math.abs((field.height || 0) - (live.height || 0)) < 0.35);
        if (
          field &&
          sizeOk &&
          Math.abs(field.x - live.x) < 0.35 &&
          Math.abs(field.y - live.y) < 0.35
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
    const page = Number(e.currentTarget.dataset.page || 1);
    onPlace(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)), page);
  }

  function boxRect(from: HTMLElement) {
    return ((from.closest(".doc-page") as HTMLElement | null) || surfaceRef.current)?.getBoundingClientRect();
  }

  function startFieldDrag(e: ReactPointerEvent<HTMLDivElement>, field: FieldView) {
    if (!onFieldMove || !canMoveType(field.type)) return;
    if ((e.target as HTMLElement).closest(".doc-mark-handle, .doc-mark-x")) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = boxRect(e.currentTarget);
    if (!rect) return;
    const boxW = rect.width;
    const boxH = rect.height;
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
      const dx = ((ev.clientX - startX) / boxW) * 100;
      const dy = ((ev.clientY - startY) / boxH) * 100;
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

  function startResize(
    e: ReactPointerEvent<HTMLButtonElement>,
    field: FieldView,
    corner: "nw" | "ne" | "sw" | "se",
  ) {
    if (!onFieldMove) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = boxRect(e.currentTarget);
    if (!rect) return;
    const boxW = rect.width;
    const boxH = rect.height;
    const origin = {
      x: field.x,
      y: field.y,
      width: field.width || (field.type === "date" ? 20 : 28),
      height: field.height || (field.type === "date" ? 8 : 10),
    };
    const startX = e.clientX;
    const startY = e.clientY;
    let last = { ...origin };
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - startX) / boxW) * 100;
      const dy = ((ev.clientY - startY) / boxH) * 100;
      let { x, y, width, height } = origin;
      if (corner.includes("e")) width = origin.width + dx;
      if (corner.includes("w")) width = origin.width - dx;
      if (corner.includes("s")) height = origin.height + dy;
      if (corner.includes("n")) height = origin.height - dy;
      width = Math.min(70, Math.max(8, width));
      height = Math.min(40, Math.max(4, height));
      if (corner.includes("w")) x = origin.x + origin.width - width;
      if (corner.includes("n")) y = origin.y + origin.height - height;
      x = Math.min(100 - width, Math.max(0, x));
      y = Math.min(100 - height, Math.max(0, y));
      last = { x, y, width, height };
      setDragPos((prev) => ({ ...prev, [field.id]: last }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        handle.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      onFieldMove?.(field.id, last.x, last.y, { width: last.width, height: last.height });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function marksFor(page: number) {
    return fields
      .filter((field) => (field.page || 1) === page)
      .map((field) => {
          const pending = !field.skipped && !field.value && !field.signature;
          if (pending && !highlightPending && !interactive && !onFieldSelect) return null;
          const live = dragPos[field.id];
          const w = live?.width ?? field.width ?? 28;
          const h = Math.max(live?.height ?? field.height ?? 8, 4);
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
              title={movable ? "Drag to move. Drag a corner to make it smaller or bigger." : undefined}
            >
              {onFieldCut && !field.skipped ? (
                <button
                  type="button"
                  className="doc-mark-x"
                  aria-label={`Remove ${field.type}`}
                  title="Cut"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFieldCut(field.id);
                  }}
                >
                  ×
                </button>
              ) : null}
              {movable
                ? (["nw", "ne", "sw", "se"] as const).map((corner) => (
                    <button
                      key={corner}
                      type="button"
                      className={`doc-mark-handle handle-${corner}`}
                      aria-label={`Resize ${field.type}`}
                      title="Drag to resize"
                      onPointerDown={(e) => startResize(e, field, corner)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ))
                : null}
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
              ) : field.type === "date" ? (
                <FitSignatureText
                  text={field.value || "Date"}
                  style={field.signature?.style}
                  maxPx={80}
                  minPx={10}
                />
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
        });
  }

  const source = fileDataUrl || remoteUrl;

  const staticPage = (
    <div className="doc-page" data-page={1} onClick={interactive ? handleClick : undefined}>
      {fileKind === "image" && source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="Document" className="doc-page-media" />
      ) : (
        <pre className="doc-surface-text">{content}</pre>
      )}
      <div className="doc-page-marks">{marksFor(1)}</div>
    </div>
  );

  return (
    <div ref={surfaceRef} className={`doc-surface ${interactive ? "is-interactive" : ""}`}>
      {fileError ? <p className="p-4 text-sm text-muted">{fileError}</p> : null}
      {fileKind === "pdf" && fileId && !source && !fileError ? (
        <p className="p-4 text-sm text-muted">Opening document…</p>
      ) : null}
      {fileKind === "pdf" && source ? (
        <PdfPageStack
          src={source}
          onPlace={interactive && onPlace ? (page, x, y) => onPlace(x, y, page) : undefined}
          renderOverlay={marksFor}
        />
      ) : source || fileKind !== "pdf" ? (
        staticPage
      ) : null}
    </div>
  );
}
