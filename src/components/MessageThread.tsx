"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ReportModal } from "./ReportModal";
import { useToast } from "./Toast";
import { formatTime, relativeTime } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { Message } from "@/lib/types";

const POLL_INTERVAL_MS = 15000;

/**
 * Conversation thread. 12.5 specifies WebSocket delivery with a 15-second
 * polling fallback; this build uses the polling path.
 */
export function MessageThread({
  conversationId,
  initialMessages,
  viewerId,
  otherUsername,
  otherUserId,
  canSend,
}: {
  conversationId: string;
  initialMessages: Message[];
  viewerId: string;
  otherUsername: string;
  otherUserId: string;
  canSend: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const { toast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Polling fallback for real-time delivery.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=100`);
        if (!response.ok) return;
        const body = await response.json();
        const fresh = (body.data as Message[]).slice().reverse();
        setMessages((current) => (fresh.length === current.length ? current : fresh));
      } catch {
        // A dropped poll is not worth surfacing; the next tick retries.
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [conversationId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const body = await response.json();

      if (!response.ok) {
        toast(body?.error?.message ?? "We could not send that message.", { tone: "error" });
        return;
      }

      setMessages((current) => [...current, body as Message]);
      setDraft("");
      track("message_sent", { conversation_id: conversationId, is_first_in_thread: messages.length === 0 });

      // 10.1 — tell the sender when contact details were stripped.
      if (body.warning === "contact_details_removed") {
        toast(
          "We removed contact details from your message. Keep conversations on TeenTrade so our team can help if something goes wrong.",
          { tone: "info" },
        );
      }
    } catch {
      toast("We could not reach TeenTrade. Check your connection and try again.", { tone: "error" });
    } finally {
      setSending(false);
    }
  }

  async function block() {
    setBlocking(true);
    try {
      const response = await fetch(`/api/v1/users/${otherUserId}/block`, { method: "POST" });
      if (!response.ok) throw new Error("Could not block");
      track("user_blocked", { source: "conversation" });
      toast(`You blocked @${otherUsername}. They cannot message you or see your listings.`);
      window.location.href = "/messages";
    } catch {
      toast("We could not block that user. Try again shortly.", { tone: "error" });
    } finally {
      setBlocking(false);
    }
  }

  return (
    <>
      <div className="tt-thread" role="log" aria-label={`Conversation with ${otherUsername}`}>
        {messages.length === 0 ? (
          <p className="t-body" style={{ color: "var(--ink-muted)", textAlign: "center", padding: "var(--space-8) 0" }}>
            Say hello. Ask about condition, size, or when they can meet.
          </p>
        ) : (
          messages.map((message) => {
            if (message.kind === "system") {
              return (
                <div key={message.id} className="tt-system-message">
                  <Icon name="info" size={14} />
                  <span>{message.body}</span>
                </div>
              );
            }

            const mine = message.sender_id === viewerId;
            return (
              <div key={message.id} className={`tt-bubble-row${mine ? " is-mine" : ""}`}>
                <div className={`tt-bubble${mine ? " is-mine" : ""}`}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.body}</p>
                  <span className="tt-bubble-time" title={relativeTime(message.created_at)}>
                    {formatTime(message.created_at)}
                    {message.redacted ? " · contact details removed" : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {canSend ? (
        <form onSubmit={send} style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <label htmlFor="message-input" className="sr-only">
            Message {otherUsername}
          </label>
          <input
            id="message-input"
            className="input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message @${otherUsername}`}
            maxLength={2000}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
            {sending ? <span className="btn-spinner" /> : <Icon name="send" size={16} />}
            <span className="sr-only">Send</span>
          </button>
        </form>
      ) : (
        <p
          className="t-body"
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-4)",
            background: "var(--amber-subtle)",
            border: "1px solid var(--amber-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--ink-secondary)",
          }}
        >
          You can read this conversation, but you cannot reply until your parent or guardian confirms your
          account.
        </p>
      )}

      {/* Safety actions */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--ink-muted)" }}
          onClick={() => setReportOpen(true)}
        >
          <Icon name="flag" size={14} />
          Report this conversation
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--ink-muted)" }}
          onClick={block}
          disabled={blocking || !otherUserId}
        >
          <Icon name="ban" size={14} />
          Block @{otherUsername}
        </button>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="message"
        targetId={conversationId}
        targetLabel={`Conversation with @${otherUsername}`}
      />
    </>
  );
}
