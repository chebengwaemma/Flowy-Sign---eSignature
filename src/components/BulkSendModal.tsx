"use client";

import Link from "next/link";
import { useEffect } from "react";

function ShipArt() {
  return (
    <svg
      viewBox="0 0 560 220"
      className="bulk-art"
      role="img"
      aria-label="Illustration of a cargo ship"
    >
      <rect width="560" height="220" fill="#f3f1ef" />
      <g fill="none" stroke="#1e1919" strokeWidth="2" strokeLinecap="round">
        <path d="M70 48c12-18 38-18 48 0 10-12 28-10 34 4" />
        <path d="M400 42c14-16 36-14 44 2 12-10 28-8 34 6" />
        <path d="M120 36l4-10M132 30l2-8M480 34l3-9" />
      </g>
      <g fill="none" stroke="#1e1919" strokeWidth="2" strokeLinecap="round">
        <path d="M210 58c4-6 10-6 14 0M230 52c3-5 8-5 11 0" />
      </g>
      <g fill="none" stroke="#1e1919" strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <path d="M20 188h520" />
        <path d="M40 198h120M200 198h80M320 198h160" />
      </g>
      <path
        d="M95 168h355l-18 22H118z"
        fill="#fff"
        stroke="#1e1919"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M118 168v-10h310v10" fill="#fff" stroke="#1e1919" strokeWidth="2" />
      <rect x="360" y="118" width="72" height="40" fill="#fff" stroke="#1e1919" strokeWidth="2" rx="2" />
      <g stroke="#1e1919" strokeWidth="1.8">
        <rect x="130" y="128" width="42" height="30" fill="#ff4fa3" rx="1" />
        <rect x="174" y="128" width="42" height="30" fill="#ff6b35" rx="1" />
        <rect x="218" y="128" width="42" height="30" fill="#1fa97a" rx="1" />
        <rect x="262" y="128" width="42" height="30" fill="#ff4fa3" rx="1" />
        <rect x="306" y="128" width="42" height="30" fill="#3b82f6" rx="1" />
        <rect x="152" y="98" width="42" height="30" fill="#1fa97a" rx="1" />
        <rect x="196" y="98" width="42" height="30" fill="#ff4fa3" rx="1" />
        <rect x="240" y="98" width="42" height="30" fill="#ff8f4a" rx="1" />
        <rect x="284" y="98" width="42" height="30" fill="#ff4fa3" rx="1" />
        <rect x="218" y="68" width="42" height="30" fill="#ff4fa3" rx="1" />
        <rect x="262" y="68" width="42" height="30" fill="#147a58" rx="1" />
      </g>
    </svg>
  );
}

export function BulkSendModal({
  open,
  onClose,
  title,
  body,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="bulk-overlay" role="presentation" onClick={onClose}>
      <div
        className="bulk-modal rise"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bulk-art-wrap">
          <ShipArt />
        </div>
        <div className="bulk-content">
          <h2 id="bulk-title">{title}</h2>
          <p>{body}</p>
          <div className="bulk-actions">
            <Link href="/billing" className="bulk-learn" onClick={onClose}>
              Learn more
            </Link>
            <div className="bulk-btns">
              <button type="button" className="bulk-close" onClick={onClose}>
                Close
              </button>
              <Link href="/billing" className="bulk-cta" onClick={onClose}>
                View plans and pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
