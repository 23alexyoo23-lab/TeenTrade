import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { avatarInk, avatarTint, initials } from "@/lib/format";
import type { PublicUser, TransactionType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* -------------------------------------------------------------------------- */

export function Avatar({
  user,
  size = 40,
}: {
  user: Pick<PublicUser, "username" | "avatar_url">;
  size?: number;
}) {
  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "var(--radius-full)", objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: avatarTint(user.username),
        color: avatarInk(avatarTint(user.username)),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.max(11, Math.round(size * 0.36)),
        flexShrink: 0,
      }}
    >
      {initials(user.username)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges (7.2, 7.6)                                                          */
/* -------------------------------------------------------------------------- */

const TRANSACTION_BADGE: Record<TransactionType, { label: string; className: string }> = {
  sell: { label: "Buy", className: "badge-buy" },
  trade: { label: "Trade", className: "badge-trade" },
  giveaway: { label: "Giveaway", className: "badge-giveaway" },
};

export function TransactionBadges({ types }: { types: TransactionType[] }) {
  // Order is fixed so cards stay visually consistent regardless of input order.
  const ordered: TransactionType[] = (["sell", "trade", "giveaway"] as const).filter((t) =>
    types.includes(t),
  );
  return (
    <>
      {ordered.map((type) => (
        <span key={type} className={`badge ${TRANSACTION_BADGE[type].className}`}>
          {TRANSACTION_BADGE[type].label}
        </span>
      ))}
    </>
  );
}

export function Badge({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "buy" | "trade" | "giveaway" | "condition" | "green" | "red" | "amber";
  icon?: IconName;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Section header used by every rail and list surface                         */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        marginBottom: "var(--space-4)",
      }}
    >
      <h2 className="t-h3" style={{ margin: 0 }}>
        {title}
      </h2>
      {action ??
        (href ? (
          <Link href={href} className="btn btn-ghost btn-sm" style={{ paddingInline: 8 }}>
            {linkLabel}
          </Link>
        ) : null)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7.9 Empty states                                                           */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  headline,
  body,
  action,
}: {
  icon: IconName;
  headline: string;
  body: string;
  action?: { label: string; href: string } | ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "var(--space-12) var(--space-6)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
      }}
    >
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
          marginBottom: "var(--space-1)",
        }}
      >
        <Icon name={icon} size={28} />
      </span>
      <h3 className="t-h3" style={{ margin: 0 }}>
        {headline}
      </h3>
      <p className="t-body" style={{ margin: 0, color: "var(--ink-muted)", maxWidth: 420 }}>
        {body}
      </p>
      {action ? (
        <div style={{ marginTop: "var(--space-2)" }}>
          {isLinkAction(action) ? (
            <Link href={action.href} className="btn btn-primary">
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      ) : null}
    </div>
  );
}

function isLinkAction(value: unknown): value is { label: string; href: string } {
  return typeof value === "object" && value !== null && "href" in value && "label" in value;
}

/* -------------------------------------------------------------------------- */
/* Banners                                                                    */
/* -------------------------------------------------------------------------- */

export function Banner({
  tone,
  icon,
  title,
  children,
  action,
}: {
  tone: "info" | "amber" | "error" | "success";
  icon?: IconName;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    info: { bg: "var(--blue-subtle)", fg: "var(--blue-primary)", border: "transparent" },
    amber: { bg: "var(--amber-subtle)", fg: "var(--amber)", border: "var(--amber-border)" },
    error: { bg: "var(--red-subtle)", fg: "var(--red)", border: "transparent" },
    success: { bg: "var(--green-subtle)", fg: "#047857", border: "transparent" },
  }[tone];

  return (
    <div
      style={{
        background: tones.bg,
        border: `1px solid ${tones.border}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        display: "flex",
        gap: "var(--space-3)",
        alignItems: "flex-start",
      }}
    >
      {icon ? (
        <span style={{ color: tones.fg, flexShrink: 0, marginTop: 1 }}>
          <Icon name={icon} size={20} />
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <p className="t-body-md" style={{ margin: 0, color: tones.fg }}>
            {title}
          </p>
        ) : null}
        {children ? (
          <div className="t-body" style={{ color: "var(--ink-secondary)", marginTop: title ? 4 : 0 }}>
            {children}
          </div>
        ) : null}
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Rating row                                                                 */
/* -------------------------------------------------------------------------- */

export function Rating({
  average,
  count,
  size = 16,
}: {
  average: number | null;
  count: number;
  size?: number;
}) {
  if (average === null || count === 0) {
    return (
      <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
        No reviews yet
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "var(--brand-yellow)", display: "inline-flex" }}>
        <Icon name="star-filled" size={size} />
      </span>
      <span className="t-body-md">{average.toFixed(1)}</span>
      <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Stars, used in review lists                                                */
/* -------------------------------------------------------------------------- */

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= value ? "var(--brand-yellow)" : "var(--border-strong)", display: "inline-flex" }}
        >
          <Icon name={n <= value ? "star-filled" : "star"} size={size} />
        </span>
      ))}
    </span>
  );
}
