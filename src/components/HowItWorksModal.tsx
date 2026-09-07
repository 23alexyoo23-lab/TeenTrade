"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { PAYMENT_DISCLAIMER } from "@/lib/constants";

const STEPS = [
  {
    icon: "shield" as const,
    title: "Everyone here is a teen",
    body: "Every account is age verified at signup. TeenTrade is for 13 to 19 year olds only, so there are no adult accounts.",
  },
  {
    icon: "image" as const,
    title: "List in three steps",
    body: "Add up to ten photos, fill in the details, then choose whether you want to sell, trade, or give the item away.",
  },
  {
    icon: "swap" as const,
    title: "Buy, offer, or swap",
    body: "Buy Now to arrange a handover, Make Offer to negotiate a price, or Offer a Trade using items from your own listings.",
  },
  {
    icon: "map-pin" as const,
    title: "Meet somewhere safe",
    body: "Pick a verified meetup location: an MRT station control, a public library, a community centre, or a mall counter. Bring a friend.",
  },
];

/** 8.1 — "How it works" hero CTA opens this explainer. */
export function HowItWorksModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-tertiary" onClick={() => setOpen(true)}>
        <Icon name="play" size={16} />
        How it works
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="How TeenTrade works" width={560}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-4)" }}>
          {STEPS.map((step, index) => (
            <li key={step.title} style={{ display: "flex", gap: "var(--space-3)" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: "var(--radius-md)",
                  background: "var(--brand-yellow-subtle)",
                  color: "var(--amber)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={step.icon} size={20} />
              </span>
              <div>
                <p className="t-body-md" style={{ margin: 0 }}>
                  {index + 1}. {step.title}
                </p>
                <p className="t-body" style={{ margin: "2px 0 0", color: "var(--ink-secondary)" }}>
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p
          className="t-caption"
          style={{
            margin: "var(--space-5) 0 0",
            padding: "var(--space-3)",
            background: "var(--blue-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--ink-secondary)",
          }}
        >
          {PAYMENT_DISCLAIMER}
        </p>
      </Modal>
    </>
  );
}
