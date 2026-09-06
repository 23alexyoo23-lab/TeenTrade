import { Icon } from "./Icon";
import { PAYMENT_DISCLAIMER } from "@/lib/constants";

/** 10.4 — stated in the purchase modal, the safety hub and the terms. */
export function PaymentNotice() {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-3)",
        background: "var(--blue-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
      }}
    >
      <span style={{ color: "var(--blue-primary)", flexShrink: 0 }}>
        <Icon name="info" size={20} />
      </span>
      <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>
        {PAYMENT_DISCLAIMER}
      </p>
    </div>
  );
}
