"use client";

import { type CSSProperties, type MouseEvent } from "react";
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
  selectedFieldId,
  highlightPending = false,
}: {
  content: string;
  fileKind?: DocFileKind;
  fileDataUrl?: string;
  fields: FieldView[];
  interactive?: boolean;
  onPlace?: (xPct: number, yPct: number) => void;
  onFieldSelect?: (fieldId: string) => void;
  selectedFieldId?: string | null;
  highlightPending?: boolean;
}) {
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (!interactive || !onPlace) return;
    if ((e.target as HTMLElement).closest(".doc-mark")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.min(88, Math.max(2, x)), Math.min(92, Math.max(2, y)));
  }

  return (
    <div
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
          const markStyle: CSSProperties = {
            left: `${field.x}%`,
            top: `${field.y}%`,
            width: `${w}%`,
            height: `${h}%`,
          };
          const label = field.signature?.text || field.value || field.type;
          const selected = selectedFieldId === field.id;

          return (
            <div
              key={field.id}
              className={[
                "doc-mark",
                `doc-mark-${field.type}`,
                field.skipped ? "is-skipped" : pending ? "is-pending" : "is-signed",
                selected ? "is-selected" : "",
                onFieldSelect ? "is-selectable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={markStyle}
              onClick={
                onFieldSelect
                  ? (e) => {
                      e.stopPropagation();
                      onFieldSelect(field.id);
                    }
                  : undefined
              }
              role={onFieldSelect ? "button" : undefined}
              tabIndex={onFieldSelect ? 0 : undefined}
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
