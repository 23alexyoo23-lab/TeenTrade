"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Modal } from "./Modal";
import { ReportModal } from "./ReportModal";
import { useToast } from "./Toast";
import type { ReportTargetType } from "@/lib/types";

/**
 * 8.7 section 3 — three entry points into the report modal. Each first asks
 * for the thing being reported, since the hub has no context of its own.
 */
const ENTRIES: { type: ReportTargetType; icon: IconName; title: string; body: string; prompt: string; help: string }[] = [
  {
    type: "listing",
    icon: "list",
    title: "Report a listing",
    body: "Prohibited items, counterfeits, misleading photos.",
    prompt: "Which listing?",
    help: "Paste the listing link, or its ID from the address bar.",
  },
  {
    type: "user",
    icon: "user",
    title: "Report a user",
    body: "Harassment, scams, or someone who is not a teen.",
    prompt: "Which user?",
    help: "Enter their username, without the @.",
  },
  {
    type: "message",
    icon: "message",
    title: "Report a message",
    body: "Anything said to you that crossed a line.",
    prompt: "Which conversation?",
    help: "Open the conversation and use Report there, or paste its link here.",
  },
];

export function ReportEntryPoints() {
  const router = useRouter();
  const { toast } = useToast();
  const [picking, setPicking] = useState<(typeof ENTRIES)[number] | null>(null);
  const [value, setValue] = useState("");
  const [resolved, setResolved] = useState<{ type: ReportTargetType; id: string; label: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveTarget() {
    setError(null);
    const raw = value.trim();
    if (!raw) {
      setError("Enter something so we know what to look at.");
      return;
    }

    // Accept a full URL or a bare id or username.
    const id = raw.split("?")[0].split("/").filter(Boolean).pop() ?? raw;

    if (!picking) return;
    setChecking(true);

    try {
      if (picking.type === "user") {
        const username = id.replace(/^@/, "");
        const response = await fetch(`/api/v1/users/lookup?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
          setError("We could not find a user with that username.");
          return;
        }
        const body = await response.json();
        setResolved({ type: "user", id: body.id, label: `@${body.username}` });
      } else if (picking.type === "listing") {
        const response = await fetch(`/api/v1/listings/${encodeURIComponent(id)}`);
        if (!response.ok) {
          setError("We could not find that listing. Check the link and try again.");
          return;
        }
        const body = await response.json();
        setResolved({ type: "listing", id: body.id, label: body.title });
      } else {
        // Message reports carry the conversation id; the moderation queue
        // resolves the individual message from the thread.
        setResolved({ type: "message", id, label: "Reported conversation" });
      }
      setPicking(null);
      setValue("");
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {ENTRIES.map((entry) => (
          <button
            key={entry.type}
            type="button"
            className="card"
            style={{
              padding: "var(--space-5)",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
            onClick={() => {
              if (entry.type === "message") {
                // The thread already knows which conversation it is, so send
                // the user there rather than asking them to paste a link.
                toast("Open the conversation and use Report at the bottom of the thread.", { tone: "info" });
                router.push("/messages");
                return;
              }
              setPicking(entry);
              setError(null);
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md)",
                background: "var(--red-subtle)",
                color: "var(--red)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={entry.icon} size={18} />
            </span>
            <span className="t-body-md">{entry.title}</span>
            <span className="t-caption" style={{ color: "var(--ink-muted)" }}>{entry.body}</span>
          </button>
        ))}
      </div>

      <Modal
        open={picking !== null}
        onClose={() => {
          setPicking(null);
          setValue("");
          setError(null);
        }}
        title={picking?.prompt ?? ""}
        footer={
          <>
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={() => {
                setPicking(null);
                setValue("");
              }}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={resolveTarget} disabled={checking}>
              {checking ? <span className="btn-spinner" /> : "Continue"}
            </button>
          </>
        }
      >
        {error ? (
          <p className="field-error" role="alert" aria-live="polite" style={{ marginBottom: "var(--space-3)" }}>
            {error}
          </p>
        ) : null}
        <label className="field-label" htmlFor="report-target">
          {picking?.type === "user" ? "Username" : "Listing link or ID"}
        </label>
        <p className="field-help">{picking?.help}</p>
        <input
          id="report-target"
          className="input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void resolveTarget();
            }
          }}
        />
      </Modal>

      {resolved ? (
        <ReportModal
          open
          onClose={() => setResolved(null)}
          targetType={resolved.type}
          targetId={resolved.id}
          targetLabel={resolved.label}
        />
      ) : null}
    </>
  );
}
