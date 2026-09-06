import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { MessageThread } from "@/components/MessageThread";
import { Avatar } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import {
  getConversation,
  getListing,
  getOffer,
  getUserById,
  isBlockedEitherWay,
  markConversationRead,
  messagesIn,
  toPublicUser,
} from "@/lib/data";
import { formatPrice, presenceLabel } from "@/lib/format";
import { meetupLocationById } from "@/lib/constants";

export const metadata = { title: "Conversation" };

/** 5.1 Messages > Conversation thread. */
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  const conversation = await getConversation(id);
  if (!conversation || !conversation.participant_ids.includes(user.id)) notFound();

  const otherId = conversation.participant_ids.find((participant) => participant !== user.id);
  const other = otherId ? await getUserById(otherId) : undefined;

  // 10.3 — blocked users cannot open a conversation with the blocker.
  if (otherId && await isBlockedEitherWay(user.id, otherId)) {
    return (
      <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
        <h1 className="t-h1" style={{ marginTop: 0 }}>This conversation is closed</h1>
        <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
          You cannot message this person. If you blocked them, you can unblock them from Settings.
        </p>
        <Link href="/messages" className="btn btn-primary">
          Back to messages
        </Link>
      </div>
    );
  }

  await markConversationRead(id, user.id);

  const messages = await messagesIn(id);
  const listing = conversation.listing_id ? await getListing(conversation.listing_id, user.id) : null;
  const offer = conversation.offer_id ? await getOffer(conversation.offer_id) : null;
  const meetup = offer?.meetup_location_id ? meetupLocationById(offer.meetup_location_id) : null;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-6) var(--space-12)", maxWidth: 880 }}>
      <Link href="/messages" className="btn btn-ghost btn-sm" style={{ paddingInline: 8, marginBottom: "var(--space-4)" }}>
        <Icon name="chevron-left" size={16} />
        All messages
      </Link>

      {/* Thread header */}
      <div
        className="card"
        style={{
          padding: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          marginBottom: "var(--space-4)",
        }}
      >
        {other ? <Avatar user={toPublicUser(other)} size={44} /> : null}
        <div style={{ flex: 1, minWidth: 160 }}>
          <Link
            href={`/profile/${other?.username ?? ""}`}
            className="t-body-md"
            style={{ color: "var(--ink)", textDecoration: "none" }}
          >
            @{other?.username ?? "deleted user"}
          </Link>
          {other ? (
            <p className="t-caption" style={{ margin: 0, color: "var(--ink-muted)" }}>
              {presenceLabel(other.last_active_at)}
            </p>
          ) : null}
        </div>

        {listing ? (
          <Link
            href={`/listing/${listing.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "6px 10px 6px 6px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-subtle)",
                overflow: "hidden",
              }}
            >
              {listing.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.cover_image_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </span>
            <span>
              <span className="t-caption line-clamp-1" style={{ display: "block", maxWidth: 180 }}>
                {listing.title}
              </span>
              <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
                {formatPrice(listing.price_cents, listing.transaction_types)}
              </span>
            </span>
          </Link>
        ) : null}
      </div>

      {/* Pinned meetup summary (9.4) */}
      {meetup ? (
        <div
          style={{
            background: "var(--green-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            display: "flex",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          <span style={{ color: "#047857", flexShrink: 0 }}>
            <Icon name="map-pin" size={20} />
          </span>
          <div>
            <p className="t-body-md" style={{ margin: 0, color: "#047857" }}>
              Meeting at {meetup.name}
            </p>
            <p className="t-caption" style={{ margin: "2px 0 0", color: "var(--ink-secondary)" }}>
              {meetup.nearest_mrt} · {meetup.opening_hours}. Bring a friend and check the item before any
              money changes hands.
            </p>
          </div>
        </div>
      ) : null}

      <MessageThread
        conversationId={id}
        initialMessages={messages}
        viewerId={user.id}
        otherUsername={other?.username ?? "this user"}
        otherUserId={otherId ?? ""}
        canSend={user.account_status === "active"}
      />
    </div>
  );
}
