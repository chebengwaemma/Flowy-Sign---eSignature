"use client";

import { LocalDate } from "@/components/LocalDate";

type ActiveSession = {
  session_id: string;
  device_label: string;
  last_seen_at: string;
  created_at?: string;
};

export function SessionLimitModal({
  open,
  error,
  maxSessions,
  sessions,
  pendingToken,
  loadingId,
  onClose,
  onTerminate,
}: {
  open: boolean;
  error: string;
  maxSessions: number;
  sessions: ActiveSession[];
  pendingToken: string;
  loadingId: string | null;
  onClose: () => void;
  onTerminate: (sessionId: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="session-limit-backdrop" role="presentation" onClick={onClose}>
      <div
        className="session-limit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-limit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="session-limit-kicker">Device limit</p>
        <h2 id="session-limit-title">You&apos;re signed in on {maxSessions} devices</h2>
        <p className="session-limit-lead">
          {error || "End one active session to continue on this device. Sessions never time out on their own."}
        </p>
        <ul className="session-limit-list">
          {sessions.map((s) => (
            <li key={s.session_id}>
              <div>
                <strong>{s.device_label}</strong>
                <span>Last active <LocalDate iso={s.last_seen_at} /></span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!pendingToken || loadingId === s.session_id}
                onClick={() => onTerminate(s.session_id)}
              >
                {loadingId === s.session_id ? "Ending…" : "End & continue"}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-ghost session-limit-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

