"use client";

import { useState } from "react";
import { Banner } from "@/components/ui";

export function ConsentForm({ token, username }: { token: string; username: string }) {
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Enter your name so we have a record of who gave consent.");
      return;
    }
    if (!confirmed) {
      setError("Tick the box to confirm you are the parent or guardian.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/auth/parent-consent/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_name: name, confirmed }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "We could not record your confirmation.");
        return;
      }
      setDone(true);
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Banner tone="success" icon="check-circle" title={`Thank you. @${username}'s account is now active.`}>
        We have let them know. You can close this page. If you ever want the account removed, your teen can
        request deletion from Settings, or you can contact our moderation team.
      </Banner>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {error ? (
        <div style={{ marginBottom: "var(--space-4)" }} aria-live="polite">
          <Banner tone="error" icon="alert-triangle" title={error} />
        </div>
      ) : null}

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="parent-name">
          Your full name
        </label>
        <input
          id="parent-name"
          className="input"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <label
        style={{
          display: "flex",
          gap: "var(--space-3)",
          alignItems: "flex-start",
          marginBottom: "var(--space-6)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
        />
        <span className="t-body" style={{ color: "var(--ink-secondary)" }}>
          I am the parent or legal guardian of @{username}, and I consent to them using TeenTrade.
        </span>
      </label>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? <span className="btn-spinner" /> : "Confirm consent"}
      </button>
    </form>
  );
}
