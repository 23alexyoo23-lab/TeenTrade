import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, EmptyState } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import {
  conversationsFor,
  getListing,
  getUserById,
  lastMessageIn,
  toPublicUser,
  unreadCountIn,
} from "@/lib/data";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Messages" };

/** 5.1 Messages > Conversation list. */
export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/messages");

  const conversations = await Promise.all(
    (await conversationsFor(user.id)).map(async (conversation) => {
      const otherId = conversation.participant_ids.find((id) => id !== user.id);
      const other = otherId ? await getUserById(otherId) : undefined;
      return {
        id: conversation.id,
        other: other ? toPublicUser(other) : null,
        listing: conversation.listing_id
          ? await getListing(conversation.listing_id, user.id)
          : null,
        last: await lastMessageIn(conversation.id),
        unread: await unreadCountIn(conversation.id, user.id),
        updatedAt: conversation.updated_at,
      };
    }),
  );

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 880 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Messages</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)", marginBottom: "var(--space-6)" }}>
        Keep conversations here. On-platform messages are moderated, so our team can help if something goes
        wrong.
      </p>

      {conversations.length === 0 ? (
        <EmptyState
          icon="chat"
          headline="No messages yet"
          body="When you contact a seller or someone contacts you, the conversation appears here."
          action={{ label: "Explore items", href: "/buy" }}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-2)" }}>
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link href={`/messages/${conversation.id}`} className="tt-conversation-row">
                {conversation.other ? <Avatar user={conversation.other} size={44} /> : null}

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span className="t-body-md">
                      @{conversation.other?.username ?? "deleted user"}
                    </span>
                    <span className="t-caption" style={{ color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                      {relativeTime(conversation.updatedAt)}
                    </span>
                  </span>

                  {conversation.listing ? (
                    <span className="t-caption line-clamp-1" style={{ display: "block", color: "var(--blue-link)" }}>
                      {conversation.listing.title}
                    </span>
                  ) : null}

                  <span
                    className="t-body line-clamp-1"
                    style={{
                      display: "block",
                      color: conversation.unread > 0 ? "var(--ink)" : "var(--ink-muted)",
                      fontWeight: conversation.unread > 0 ? 500 : 400,
                      marginTop: 2,
                    }}
                  >
                    {conversation.last
                      ? `${conversation.last.sender_id === user.id ? "You: " : ""}${conversation.last.body}`
                      : "No messages yet"}
                  </span>
                </span>

                {conversation.unread > 0 ? (
                  <span className="badge" style={{ background: "var(--red)", color: "#fff" }}>
                    {conversation.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
