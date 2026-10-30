"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function Chatbot({
  enabled = true,
  name = "Flowy Assist",
  greeting = "Hi — I'm Flowy Assist. Ask me about signing, fax, team, or billing.",
}: {
  enabled?: boolean;
  name?: string;
  greeting?: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: greeting }]);
  }, [greeting]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!enabled) return null;

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "I’m here — ask about signing, plans, fax, team, or billing.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Connection issue. Please try again — I can still help with signing and plans.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-fab">
      {open && (
        <div className="panel mb-3 flex h-[min(420px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rise">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-muted">{busy ? "Typing…" : "Online · Instant help"}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "ml-auto bg-ink text-white" : "bg-mist text-ink"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] rounded-2xl bg-mist px-3 py-2 text-sm text-muted">
                <span className="chat-typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-[var(--line)] p-3">
            <input
              ref={inputRef}
              className="field"
              value={input}
              placeholder="Ask anything…"
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-accent px-3"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
      >
        <MessageCircle size={18} />
        Help
      </button>
    </div>
  );
}
