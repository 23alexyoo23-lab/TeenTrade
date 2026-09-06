import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { ProfileActions } from "@/components/ProfileActions";
import { Avatar, Banner, EmptyState, Rating, Stars } from "@/components/ui";
import { regionLabel } from "@/lib/constants";
import { currentUser } from "@/lib/auth";
import { getUserByUsername, hasBlocked, isBlockedEitherWay, listingsBySeller, reviewsFor, toPublicUser } from "@/lib/data";
import { formatDate, presenceLabel, relativeTime } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

/** 5.1 Account > Profile (public view). */
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab } = await searchParams;

  const viewer = await currentUser();
  if (!viewer) redirect(`/login?next=/profile/${username}`);

  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const isSelf = profileUser.id === viewer.id;
  const blockedByViewer = await hasBlocked(viewer.id, profileUser.id);

  // 10.3 — a blocked user cannot see the blocker's profile listings.
  if (!isSelf && await isBlockedEitherWay(viewer.id, profileUser.id) && !blockedByViewer) {
    return (
      <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
        <Banner tone="amber" icon="ban" title="This profile is not available to you" />
      </div>
    );
  }

  const publicUser = toPublicUser(profileUser);
  const activeTab = tab === "reviews" ? "reviews" : tab === "sold" ? "sold" : "listings";

  const active = await listingsBySeller(profileUser.id, ["active", "reserved"]);
  const sold = await listingsBySeller(profileUser.id, ["sold"]);
  const reviews = await reviewsFor(profileUser.id);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 1080 }}>
      {blockedByViewer ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="amber" icon="ban" title={`You have blocked @${publicUser.username}`}>
            Their listings are hidden from your feed and search. Unblock them below or from Settings.
          </Banner>
        </div>
      ) : null}

      {/* Profile header */}
      <div
        className="card"
        style={{ padding: "var(--space-6)", display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "flex-start" }}
      >
        <Avatar user={publicUser} size={80} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="t-h2" style={{ margin: 0 }}>@{publicUser.username}</h1>

          <div style={{ marginTop: "var(--space-2)" }}>
            <Rating average={publicUser.rating_average} count={publicUser.rating_count} />
          </div>

          <p
            className="t-caption"
            style={{ margin: "var(--space-3) 0 0", color: "var(--ink-muted)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="map-pin" size={14} />
              {regionLabel(publicUser.region)} Singapore
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="clock" size={14} />
              {presenceLabel(publicUser.last_active_at)}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="calendar" size={14} />
              Joined {formatDate(publicUser.created_at)}
            </span>
          </p>

          {/* 10.5 — only a username and region are ever public. */}
          <p className="t-caption" style={{ margin: "var(--space-3) 0 0", color: "var(--ink-muted)" }}>
            TeenTrade never shows real names, addresses, schools or phone numbers.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "flex-end" }}>
          {isSelf ? (
            <>
              <Link href="/sell" className="btn btn-tertiary btn-sm">
                Manage my listings
              </Link>
              <Link href="/account/settings" className="btn btn-ghost btn-sm">
                <Icon name="settings" size={14} />
                Settings
              </Link>
            </>
          ) : (
            <ProfileActions
              userId={profileUser.id}
              username={publicUser.username}
              initiallyBlocked={blockedByViewer}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Profile sections" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBlock: "var(--space-6)" }}>
        <ProfileTab href={`/profile/${username}`} label={`Listings (${active.length})`} active={activeTab === "listings"} />
        <ProfileTab href={`/profile/${username}?tab=sold`} label={`Sold (${sold.length})`} active={activeTab === "sold"} />
        <ProfileTab href={`/profile/${username}?tab=reviews`} label={`Reviews (${reviews.length})`} active={activeTab === "reviews"} />
      </div>

      {activeTab === "reviews" ? (
        reviews.length === 0 ? (
          <EmptyState
            icon="star"
            headline="No reviews yet"
            body="Reviews appear here once a buy or a trade is completed by both sides."
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-3)" }}>
            {reviews.map((review) => (
              <li key={review.id} className="card" style={{ padding: "var(--space-5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  {review.author ? <Avatar user={review.author} size={32} /> : null}
                  <Link
                    href={review.author ? `/profile/${review.author.username}` : "#"}
                    className="t-body-md"
                    style={{ color: "var(--blue-link)", textDecoration: "none" }}
                  >
                    @{review.author?.username ?? "deleted user"}
                  </Link>
                  <Stars value={review.rating} />
                  <span className="t-caption" style={{ color: "var(--ink-muted)", marginLeft: "auto" }}>
                    {relativeTime(review.created_at)}
                  </span>
                </div>
                <p className="t-body" style={{ margin: "var(--space-3) 0 0", color: "var(--ink-secondary)" }}>
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : (
        (() => {
          const listings = activeTab === "sold" ? sold : active;
          return listings.length === 0 ? (
            <EmptyState
              icon="box"
              headline={activeTab === "sold" ? "Nothing sold yet" : "Nothing listed right now"}
              body={
                isSelf
                  ? "List your first item and it will show up here."
                  : `@${publicUser.username} has nothing ${activeTab === "sold" ? "sold" : "listed"} at the moment.`
              }
              action={isSelf ? { label: "List Item", href: "/sell/new" } : undefined}
            />
          ) : (
            <div className="grid-listings">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showSave={!isSelf} />
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}

function ProfileTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} role="tab" aria-selected={active} className={`tt-tab${active ? " is-active" : ""}`}>
      {label}
    </Link>
  );
}
