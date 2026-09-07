import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { EmptyState } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { notificationsFor } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Notifications" };

const KIND_ICON: Record<Notification["kind"], IconName> = {
  message: "message",
  offer: "swap",
  listing_status: "list",
  review: "star",
  report: "shield",
};

/** 4.1 — in-app notifications for messages, offers and listing status. */
export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/notifications");

  const notifications = await notificationsFor(user.id);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 720 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Notifications</h1>

      {/* Opening the page marks everything read. */}
      <MarkNotificationsRead hasUnread={notifications.some((n) => !n.read)} />

      {notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          headline="Nothing new"
          body="Messages, offers and updates about your listings appear here."
          action={{ label: "Explore items", href: "/buy" }}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: "var(--space-6) 0 0", padding: 0, display: "grid", gap: "var(--space-2)" }}>
          {notifications.map((notification) => {
            const content = (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-full)",
                    background: notification.read ? "var(--surface-subtle)" : "var(--brand-yellow-subtle)",
                    color: notification.read ? "var(--ink-muted)" : "var(--amber)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={KIND_ICON[notification.kind]} size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-body-md" style={{ display: "block" }}>{notification.title}</span>
                  <span className="t-body" style={{ display: "block", color: "var(--ink-secondary)" }}>
                    {notification.body}
                  </span>
                  <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
                    {relativeTime(notification.created_at)}
                  </span>
                </span>
                {!notification.read ? (
                  <span
                    aria-label="Unread"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "var(--radius-full)",
                      background: "var(--red)",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                ) : null}
              </>
            );

            const style: React.CSSProperties = {
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "flex-start",
              padding: "var(--space-4)",
              textDecoration: "none",
              color: "inherit",
            };

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <Link href={notification.href} className="card" style={style}>
                    {content}
                  </Link>
                ) : (
                  <div className="card" style={style}>
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
