"use client";

import type { SignatureStyle } from "@/lib/types";
import { SIGNATURE_STYLES, normalizeSignatureStyle } from "@/lib/signature-styles";
import { FitSignatureText } from "@/components/signature/FitSignatureText";

/**
 * Live e-signature generator — types a name into handwriting fonts in real time.
 * Preview auto-fits the container with locked proportions (no clipped letters).
 */
export function ESignatureGenerator({
  name,
  style,
  onStyleChange,
  compact = false,
}: {
  name: string;
  style: SignatureStyle;
  onStyleChange: (style: SignatureStyle) => void;
  compact?: boolean;
}) {
  const active = normalizeSignatureStyle(style);
  const preview = name.trim() || "Your name";

  return (
    <div className={`esig-gen ${compact ? "is-compact" : ""}`}>
      <div className="esig-gen-head">
        <div>
          <p className="label" style={{ marginBottom: 0 }}>
            E-signature generator
          </p>
          <p className="esig-gen-hint">
            Type the name above — it becomes a signature instantly. No drawing needed.
          </p>
        </div>
      </div>

      <div className="esig-canvas" aria-live="polite">
        <p className="esig-canvas-label">Live preview</p>
        <div className="esig-canvas-stage">
          <FitSignatureText text={preview} style={active} maxPx={72} minPx={14} />
        </div>
        <div className="esig-canvas-line" aria-hidden />
      </div>

      <p className="esig-pick-label">Handwriting style</p>
      <div className="esig-style-grid" role="listbox" aria-label="Handwriting fonts">
        {SIGNATURE_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={active === s.id}
            className={`esig-style-card ${active === s.id ? "active" : ""}`}
            onClick={() => onStyleChange(s.id)}
          >
            <div className="esig-style-sample-box">
              <FitSignatureText text={preview} style={s.id} maxPx={28} minPx={12} />
            </div>
            <span className="esig-style-meta">
              <strong>{s.label}</strong>
              <em>{s.hint}</em>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
