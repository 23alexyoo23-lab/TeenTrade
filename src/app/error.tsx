"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";

/**
 * 15.6 — every failure shows an actionable message, never a raw error code.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[teentrade]", error);
  }, [error]);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 560, textAlign: "center" }}>
      <span
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-full)",
          background: "var(--red-subtle)",
          color: "var(--red)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="alert-triangle" size={28} />
      </span>

      <h1 className="t-h1" style={{ margin: "var(--space-4) 0 var(--space-2)" }}>
        Something went wrong
      </h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)", marginTop: 0 }}>
        That is on us, not you. Try again, and if it keeps happening let our team know from the safety hub.
      </p>

      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap", marginTop: "var(--space-6)" }}>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-tertiary">
          Go home
        </Link>
      </div>
    </div>
  );
}
