"use client";

import { useLayoutEffect, useRef } from "react";
import { signatureClass } from "@/lib/signature-styles";
import type { SignatureStyle } from "@/lib/types";

/**
 * Signature text that always keeps glyph proportions, auto-fits the
 * container on resize, never clips characters, and stays left-centered.
 */
export function FitSignatureText({
  text,
  style,
  className = "",
  textClassName,
  maxPx = 96,
  minPx = 10,
}: {
  text: string;
  style?: SignatureStyle | string;
  className?: string;
  /** Override mark classes (e.g. plain date/text fields) */
  textClassName?: string;
  maxPx?: number;
  minPx?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const label = text.trim() || " ";

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    const fit = () => {
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      if (bw < 2 || bh < 2) return;

      el.style.removeProperty("font-size");
      el.style.removeProperty("transform");

      const cap = Math.max(minPx, Math.min(maxPx, Math.floor(bh * 0.92)));
      let lo = minPx;
      let hi = cap;
      let best = minPx;

      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        el.style.setProperty("font-size", `${mid}px`, "important");
        const fits = el.scrollWidth <= bw + 1 && el.scrollHeight <= bh + 1;
        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      el.style.setProperty("font-size", `${best}px`, "important");
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(box);

    let cancelled = false;
    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) fit();
      });
    }

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [label, style, textClassName, maxPx, minPx]);

  return (
    <div ref={boxRef} className={`sig-fit ${className}`.trim()} title={label}>
      <span ref={textRef} className={textClassName || signatureClass(style)}>
        {label}
      </span>
    </div>
  );
}
