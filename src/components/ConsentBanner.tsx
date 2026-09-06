"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useToast } from "./Toast";

/**
 * 9.2 — persistent banner shown across all pages while an under-16 account
 * waits for a parent or guardian to confirm it.
 */
export function ConsentBanner() {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function resend() {
    setSending(true);
    try {
      const response = await fetch("/api/v1/auth/parent-consent/resend", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not resend");
      toast("We sent the confirmation email again. Ask your parent or guardian to check their inbox.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "We could not resend the email. Try again shortly.", {
        tone: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      style={{
        background: "var(--amber-subtle)",
        borderBottom: "1px solid var(--amber-border)",
        color: "var(--ink)",
      }}
    >
      <div
        className="tt-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          paddingBlock: "10px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--amber)", display: "flex" }}>
          <Icon name="alert-triangle" size={18} />
        </span>
        <span className="t-body" style={{ flex: 1, minWidth: 220 }}>
          Waiting for your parent or guardian to confirm your account. You can browse, but you cannot list
          items or send messages yet.
        </span>
        <button type="button" className="btn btn-tertiary btn-sm" onClick={resend} disabled={sending}>
          {sending ? <span className="btn-spinner" /> : "Resend email"}
        </button>
      </div>
    </div>
  );
}
