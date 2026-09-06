"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { REPORT_REASONS } from "@/lib/constants";
import { track } from "@/lib/analytics";
import type { ReportReason, ReportTargetType } from "@/lib/types";

const MIN_DETAIL_LENGTH = 20;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** 10.2 Report modal. Reachable from listings, profiles and message threads. */
export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason("");
    setDetails("");
    setAttachment(null);
    setAttachmentName(null);
    setError(null);
  }

  async function onAttach(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Attach an image, such as a screenshot.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("That screenshot is too large. Maximum size is 5MB.");
      return;
    }

    setError(null);
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAttachment(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError(null);

    if (!reason) {
      setError("Choose a reason so we know what to look at.");
      return;
    }
    if (details.trim().length < MIN_DETAIL_LENGTH) {
      setError(`Tell us a bit more. At least ${MIN_DETAIL_LENGTH} characters helps our team act quickly.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details.trim(),
          attachment_url: attachment,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? "We could not send that report. Try again shortly.");
        return;
      }

      track("report_filed", { target_type: targetType, reason });
      toast("Thank you. Our team will review this within 24 hours.");
      reset();
      onClose();
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    targetType === "listing" ? "Report this listing" : targetType === "user" ? "Report this user" : "Report this message";

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={heading}
      width={480}
      footer={
        <>
          <button
            type="button"
            className="btn btn-tertiary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-destructive" onClick={submit} disabled={submitting}>
            {submitting ? <span className="btn-spinner" /> : "Submit report"}
          </button>
        </>
      }
    >
      <p className="t-caption" style={{ margin: "0 0 var(--space-4)", color: "var(--ink-muted)" }}>
        Reporting: <strong style={{ color: "var(--ink)" }}>{targetLabel}</strong>. You will not get in
        trouble for reporting, and we never tell the other person who reported them.
      </p>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="t-body"
          style={{
            background: "var(--red-subtle)",
            color: "var(--red)",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-4)",
          }}
        >
          {error}
        </div>
      ) : null}

      <fieldset style={{ border: 0, margin: "0 0 var(--space-4)", padding: 0 }}>
        <legend className="field-label" style={{ padding: 0 }}>Reason</legend>
        {REPORT_REASONS.map((option) => (
          <label key={option.value} className="tt-check-row">
            <input
              type="radio"
              name="report-reason"
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
            />
            <span className="t-body">{option.label}</span>
          </label>
        ))}
      </fieldset>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="report-details">
          What happened?
        </label>
        <textarea
          id="report-details"
          className="textarea"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Describe what you saw. Include anything that would help our team understand."
          maxLength={1000}
          aria-describedby="report-details-count"
        />
        <p
          id="report-details-count"
          className="t-caption"
          style={{
            marginTop: 6,
            color: details.trim().length < MIN_DETAIL_LENGTH ? "var(--ink-muted)" : "var(--ink-secondary)",
          }}
        >
          {details.trim().length} / {MIN_DETAIL_LENGTH} characters minimum
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="report-attachment">
          Screenshot (optional)
        </label>
        <input
          id="report-attachment"
          type="file"
          accept="image/*"
          onChange={onAttach}
          className="t-body"
          style={{ display: "block" }}
        />
        {attachmentName ? (
          <p className="t-caption" style={{ marginTop: 6, color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="image" size={14} />
            {attachmentName}
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                setAttachmentName(null);
              }}
              className="btn btn-ghost btn-sm"
              style={{ height: 24, paddingInline: 6 }}
            >
              Remove
            </button>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
