import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Banner } from "@/components/ui";
import { PROHIBITED_ITEMS } from "@/lib/constants";

export const metadata = { title: "Prohibited items" };

/** 10.1 — must be visible here and linked from step 3 of the listing flow. */
export default function ProhibitedItemsPage() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 760 }}>
      <Link href="/safety" className="btn btn-ghost btn-sm" style={{ paddingInline: 8, marginBottom: "var(--space-4)" }}>
        <Icon name="chevron-left" size={16} />
        Safety
      </Link>

      <h1 className="t-h1" style={{ marginTop: 0 }}>Prohibited items</h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
        These cannot be listed on TeenTrade, whatever the condition and whatever the price. Listings that
        mention them are held for review, and repeat attempts can suspend an account.
      </p>

      <ul style={{ listStyle: "none", margin: "var(--space-6) 0 0", padding: 0, display: "grid", gap: "var(--space-2)" }}>
        {PROHIBITED_ITEMS.map((item) => (
          <li
            key={item.title}
            className="card"
            style={{ padding: "var(--space-4)", display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-full)",
                background: "var(--red-subtle)",
                color: "var(--red)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="ban" size={16} />
            </span>
            <div>
              <p className="t-body-md" style={{ margin: 0 }}>{item.title}</p>
              <p className="t-body" style={{ margin: "2px 0 0", color: "var(--ink-secondary)" }}>
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-8)" }}>
        <Banner tone="amber" icon="alert-triangle" title="Seen something on this list?">
          Report it. Use the flag on the listing, or the report entry points in the{" "}
          <Link href="/safety#report" style={{ color: "var(--blue-link)" }}>
            safety hub
          </Link>
          . Three independent reports hide a listing automatically while our team reviews it.
        </Banner>
      </div>
    </div>
  );
}
