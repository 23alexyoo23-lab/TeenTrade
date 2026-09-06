"use client";

import { useState } from "react";
import { Banner } from "./ui";

const CATEGORIES = [
  { value: "safety_concern", label: "A safety concern" },
  { value: "account_problem", label: "A problem with my account" },
  { value: "listing_problem", label: "A problem with a listing" },
  { value: "report_followup", label: "Following up on a report I filed" },
  { value: "something_else", label: "Something else" },
];

/** 8.7 section 4 — contact moderation form, 24-hour response commitment. */
export function ContactModeration() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!category) {
      setError("Choose what this is about.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Tell us a bit more so we can help. At least 20 characters.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/v1/moderation/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "We could not send that. Try again shortly.");
        return;
      }
      setSent(true);
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Banner tone="success" icon="check-circle" title="Thank you. Our team will review this within 24 hours.">
        We will reply through your notifications. If this is an emergency, contact the police on 999 or call
        the Tinkle Friend helpline on 1800 274 4788.
      </Banner>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {error ? (
        <p className="field-error" role="alert" aria-live="polite" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </p>
      ) : null}

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="moderation-category">
          What is this about?
        </label>
        <select
          id="moderation-category"
          className="select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Choose one</option>
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <label className="field-label" htmlFor="moderation-message">
          Your message
        </label>
        <textarea
          id="moderation-message"
          className="textarea"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? <span className="btn-spinner" /> : "Send to moderation"}
      </button>

      <p className="t-caption" style={{ marginTop: "var(--space-4)", color: "var(--ink-muted)" }}>
        We reply within 24 hours. If you are in immediate danger, call the police on 999.
      </p>
    </form>
  );
}
