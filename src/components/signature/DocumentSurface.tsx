"use client";

import type { CSSProperties, MouseEvent } from "react";
import type { DocFileKind, SignatureField } from "@/lib/types";
import { signatureClass } from "@/lib/signature-styles";

type FieldView = Pick<
  SignatureField,
  "id" | "type" | "x" | "y" | "width" | "height" | "value" | "signature"
>;

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
  highlightPending = false,
}: {
  content: string;
  fileKind?: DocFileKind;
  fileDataUrl?: string;
  fields: FieldView[];
  interactive?: boolean;
  onPlace?: (xPct: number, yPct: number) => void;
  highlightPending?: boolean;
}) {
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (!interactive || !onPlace) return;
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
          const pending = !field.value && !field.signature;
          if (pending && !highlightPending && !interactive) return null;
          const w = field.width || 28;
          const h = Math.max(field.height || 8, 6);
          // Scale typed signature to fill the placed field box
          const fontPx = Math.max(14, Math.min(72, h * 4.2));
          const markStyle: CSSProperties = {
            left: `${field.x}%`,
            top: `${field.y}%`,
            width: `${w}%`,
            height: `${h}%`,
          };
          return (
            <div
              key={field.id}
              className={`doc-mark doc-mark-${field.type} ${pending ? "is-pending" : "is-signed"}`}
              style={markStyle}
            >
              {field.signature?.mode === "image" && field.signature.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={field.signature.imageDataUrl} alt="" className="doc-mark-img" />
              ) : field.type === "signature" || field.type === "initials" ? (
                <span
                  className={signatureClass(field.signature?.style)}
                  style={{ fontSize: `${fontPx}px` }}
                >
                  {field.signature?.text || field.value || field.type}
                </span>
              ) : (
                <span className="doc-mark-plain" style={{ fontSize: `${Math.max(12, fontPx * 0.45)}px` }}>
                  {field.value || field.type}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
