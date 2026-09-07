import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { BlockedUsers } from "@/components/BlockedUsers";
import { Icon } from "@/components/Icon";
import { Banner } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { listBlockedUsers } from "@/lib/data";
import { ageFromDob, formatDate } from "@/lib/format";
import { regionLabel } from "@/lib/constants";

export const metadata = { title: "Settings" };

/** 5.1 Account > Settings. */
export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/settings");

  const blocked = await listBlockedUsers(user.id);
  const age = ageFromDob(user.date_of_birth);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 720 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Settings</h1>

      {/* Account */}
      <section style={{ marginTop: "var(--space-6)" }}>
        <h2 className="t-h3">Your account</h2>
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <Row label="Username" value={`@${user.username}`} />
          <Row label="Email" value={user.email} />
          <Row label="Age" value={`${age}`} />
          <Row label="Region" value={`${regionLabel(user.region)} Singapore`} />
          <Row label="Member since" value={formatDate(user.created_at)} />
        </div>
        <p className="t-caption" style={{ color: "var(--ink-muted)", marginTop: "var(--space-3)" }}>
          Your email and date of birth are never shown to other users.
        </p>
      </section>

      {/* Editable profile */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h2 className="t-h3">Edit profile</h2>
        <div className="panel">
          <AccountSettings currentRegion={user.region} currentUsername={user.username} />
        </div>
      </section>

      {/* 10.3 Blocked users */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h2 className="t-h3">Blocked users</h2>
        <BlockedUsers users={blocked} />
      </section>

      {/* Safety shortcuts */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h2 className="t-h3">Safety</h2>
        <div className="card" style={{ padding: "var(--space-5)", display: "grid", gap: "var(--space-3)" }}>
          <SettingsLink href="/safety" icon="shield" label="Safety hub" />
          <SettingsLink href="/safety#meetup-locations" icon="map-pin" label="Verified meetup locations" />
          <SettingsLink href="/safety/prohibited-items" icon="ban" label="Prohibited items" />
          <SettingsLink href="/safety#contact-moderation" icon="mail" label="Contact moderation" />
        </div>
      </section>

      {/* 10.5 Data and deletion */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h2 className="t-h3">Your data</h2>
        <Banner tone="info" icon="lock" title="What we keep, and for how long">
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>Chat messages are kept for 12 months, then deleted</li>
            <li>Deleted listings are kept for 30 days for moderation reference</li>
            <li>We never store a precise location, only a region</li>
            {age < 16 ? <li>Your parental consent record is kept for the life of your account plus 2 years</li> : null}
          </ul>
        </Banner>

        <div style={{ marginTop: "var(--space-4)" }}>
          <Link href="/privacy" className="btn btn-ghost btn-sm" style={{ paddingInline: 8 }}>
            Read the full privacy notice
          </Link>
        </div>

        <div
          style={{
            marginTop: "var(--space-5)",
            padding: "var(--space-5)",
            border: "1px solid var(--red)",
            borderRadius: "var(--radius-lg)",
            background: "var(--red-subtle)",
          }}
        >
          <h3 className="t-body-md" style={{ margin: 0, color: "var(--red-text)" }}>Delete your account</h3>
          <p className="t-body" style={{ margin: "4px 0 var(--space-4)", color: "var(--ink-secondary)" }}>
            This removes your listings, saved items and profile. Deletion completes within 30 days. Messages
            linked to an open report are kept until that report is resolved.
          </p>
          <form action="/api/v1/account/delete" method="post">
            <button type="submit" className="btn btn-destructive btn-sm">
              Request account deletion
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        paddingBlock: 8,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="t-body" style={{ color: "var(--ink-secondary)" }}>{label}</span>
      <span className="t-body-md" style={{ textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function SettingsLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
}) {
  return (
    <Link
      href={href}
      className="t-body"
      style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink)", textDecoration: "none" }}
    >
      <span style={{ color: "var(--ink-muted)", display: "flex" }}>
        <Icon name={icon} size={18} />
      </span>
      {label}
      <span style={{ marginLeft: "auto", color: "var(--ink-muted)", display: "flex" }}>
        <Icon name="chevron-right" size={16} />
      </span>
    </Link>
  );
}
