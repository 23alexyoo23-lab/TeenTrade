import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 560, textAlign: "center" }}>
      <span
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-full)",
          background: "var(--surface-subtle)",
          color: "var(--ink-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="search" size={28} />
      </span>

      <h1 className="t-h1" style={{ margin: "var(--space-4) 0 var(--space-2)" }}>
        We could not find that page
      </h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)", marginTop: 0 }}>
        The link might be old, or the listing may have been sold or removed.
      </p>

      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap", marginTop: "var(--space-6)" }}>
        <Link href="/buy" className="btn btn-primary">
          Browse items
        </Link>
        <Link href="/" className="btn btn-tertiary">
          Go home
        </Link>
      </div>
    </div>
  );
}
