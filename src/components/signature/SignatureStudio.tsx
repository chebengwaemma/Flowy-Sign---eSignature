"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SignatureStyle } from "@/lib/types";
import type { GeneratorQuota } from "@/lib/generator-usage";
import {
  SIGNATURE_STYLES,
  normalizeSignatureStyle,
  signatureClass,
} from "@/lib/signature-styles";

type Mode = "type" | "draw";

/**
 * E-signature generator:
 * - type name → live handwriting fonts
 * - optional canvas draw pad
 * - download PNG (plan quota when requireQuota)
 */
export function SignatureStudio({
  requireQuota = false,
  initialQuota,
  billingHref = "/billing",
}: {
  requireQuota?: boolean;
  initialQuota?: GeneratorQuota;
  billingHref?: string;
} = {}) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<SignatureStyle>("elegant");
  const [mode, setMode] = useState<Mode>("type");
  const [quota, setQuota] = useState<GeneratorQuota | null>(initialQuota || null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = normalizeSignatureStyle(style);
  const preview = name.trim() || "Your name";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    setQuota(initialQuota || null);
  }, [initialQuota]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b1f1c";
    ctx.lineWidth = 2.4;
    ctx.fillStyle = "#fffefb";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [mode]);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fffefb";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
  }

  function buildTypedPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fffefb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(6,41,37,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 210);
    ctx.lineTo(840, 210);
    ctx.stroke();

    const text = preview;
    const size = Math.min(96, Math.max(42, 720 / Math.max(text.length * 0.42, 4)));
    const fonts: Record<string, string> = {
      elegant: `${size}px "Great Vibes", cursive`,
      script: `${size}px "Dancing Script", cursive`,
      formal: `${size}px Allura, cursive`,
      casual: `${size}px Satisfy, cursive`,
      marker: `600 ${size}px Caveat, cursive`,
      classic: `${size}px Sacramento, cursive`,
      bold: `${size}px "Permanent Marker", cursive`,
      italic: `${size}px Parisienne, cursive`,
      slant: `italic ${size}px Satisfy, cursive`,
      strike: `${size}px Sacramento, cursive`,
    };
    ctx.fillStyle = "#0b1f1c";
    ctx.font = fonts[active] || fonts.elegant;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, 70, 185, 760);
    return canvas.toDataURL("image/png");
  }

  async function downloadPng() {
    setError("");
    if (requireQuota) {
      if (quota && !quota.allowed) {
        setError(quota.message);
        return;
      }
      setBusy(true);
      try {
        const res = await fetch("/api/signature-generator/download", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.quota) setQuota(data.quota);
          setError(data.error || "Download not allowed on your plan.");
          return;
        }
        if (data.quota) setQuota(data.quota);
      } finally {
        setBusy(false);
      }
    }

    if (mode === "draw" && canvasRef.current && hasInk) {
      triggerDownload(canvasRef.current.toDataURL("image/png"), "flowy-signature.png");
      return;
    }
    const url = buildTypedPng();
    if (url) triggerDownload(url, "flowy-signature.png");
  }

  const canDownload =
    !busy &&
    (mode === "draw" ? hasInk : !!name.trim()) &&
    (!requireQuota || !quota || quota.allowed);

  return (
    <div className="sig-studio">
      {requireQuota && quota && (
        <p className="mb-3 text-sm text-muted">{quota.message}</p>
      )}

      <div className="sig-studio-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={mode === "type" ? "active" : ""}
          aria-selected={mode === "type"}
          onClick={() => setMode("type")}
        >
          Type your name
        </button>
        <button
          type="button"
          role="tab"
          className={mode === "draw" ? "active" : ""}
          aria-selected={mode === "draw"}
          onClick={() => setMode("draw")}
        >
          Draw signature
        </button>
      </div>

      {mode === "type" ? (
        <>
          <label className="sig-studio-field">
            <span className="label">Your name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your full name"
              autoComplete="name"
              autoFocus
            />
          </label>

          <div className="esig-canvas sig-studio-preview" aria-live="polite">
            <p className="esig-canvas-label">Live signature</p>
            <p key={`${active}-${preview}`} className={`esig-canvas-text ${signatureClass(active)}`}>
              {preview}
            </p>
            <div className="esig-canvas-line" aria-hidden />
          </div>

          <p className="esig-pick-label">Handwriting fonts</p>
          <div className="esig-style-grid" role="listbox" aria-label="Handwriting fonts">
            {SIGNATURE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={active === s.id}
                className={`esig-style-card ${active === s.id ? "active" : ""}`}
                onClick={() => setStyle(s.id)}
              >
                <span className={`esig-style-sample ${signatureClass(s.id)}`}>{preview}</span>
                <span className="esig-style-meta">
                  <strong>{s.label}</strong>
                  <em>{s.hint}</em>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="sig-draw-wrap">
          <p className="esig-gen-hint">
            Draw with your mouse, finger, or stylus. Clear anytime and try again.
          </p>
          <canvas
            ref={canvasRef}
            className="sig-draw-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          <button type="button" className="source-btn" onClick={clearCanvas}>
            Clear pad
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-[#f0d9c8] bg-[#fff8f3] px-3 py-2 text-sm text-ink">
          <p>{error}</p>
          {requireQuota && (
            <Link href={billingHref} className="mt-1 inline-block font-semibold text-accent-deep underline">
              View packages & buy
            </Link>
          )}
        </div>
      )}

      <div className="sig-studio-actions">
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void downloadPng()}
          disabled={!canDownload}
        >
          {busy ? "Checking plan…" : "Download PNG"}
        </button>
        {requireQuota ? (
          <Link href="/documents/new" className="btn btn-primary">
            Sign a document
          </Link>
        ) : (
          <Link href="/signup" className="btn btn-primary">
            Use in Flowy Sign
          </Link>
        )}
      </div>
    </div>
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
