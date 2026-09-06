import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { Icon } from "@/components/Icon";
import { ListingActions } from "@/components/ListingActions";
import { ListingCard } from "@/components/ListingCard";
import { OwnerActions } from "@/components/OwnerActions";
import { ViewTracker } from "@/components/ViewTracker";
import { Avatar, Badge, Banner, Rating, SectionHeader } from "@/components/ui";
import { conditionLabel, regionLabel } from "@/lib/constants";
import { currentUser } from "@/lib/auth";
import {
  getListing,
  hasBlocked,
  isBlockedEitherWay,
  listingsBySeller,
  recordView,
  sellerOtherItems,
} from "@/lib/data";
import { formatPrice, presenceLabel, relativeTime } from "@/lib/format";

/** 8.3 Listing detail. Route: /listing/{id} */
export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string; published?: string }>;
}) {
  const { id } = await params;
  const { source, published } = await searchParams;

  const user = await currentUser();
  if (!user) redirect(`/login?next=/listing/${id}`);

  const listing = await getListing(id, user.id);
  if (!listing) notFound();

  const isOwner = listing.seller_id === user.id;

  // 10.3 — a blocked user cannot view the blocker's listings.
  if (!isOwner && await isBlockedEitherWay(user.id, listing.seller_id)) {
    return (
      <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
        <Banner tone="amber" icon="ban" title="This listing is not available to you">
          {await hasBlocked(user.id, listing.seller_id)
            ? "You blocked this seller. Unblock them from Settings if you want to see their listings again."
            : "This listing cannot be shown."}
        </Banner>
      </div>
    );
  }

  // 8.3 — removed listings are replaced by a moderation notice.
  if (listing.status === "removed" || (listing.status === "pending_review" && !isOwner)) {
    return (
      <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
        <h1 className="t-h1" style={{ marginTop: 0 }}>This listing is not available</h1>
        <Banner tone="amber" icon="shield" title="Removed pending moderation review">
          Our team is reviewing this listing. If you reported it, we will let you know the outcome within
          24 hours. Nothing else is needed from you.
        </Banner>
        <div style={{ marginTop: "var(--space-6)" }}>
          <Link href="/buy" className="btn btn-primary">
            Browse other items
          </Link>
        </div>
      </div>
    );
  }

  // 12.2 GET /listings/{id} increments the view count.
  if (!isOwner) await recordView(listing.id, user.id);

  const otherItems = await sellerOtherItems(listing, user.id, 6);
  const tradeCandidates = isOwner
    ? []
    : (await listingsBySeller(user.id, ["active"])).map((item) => ({
        id: item.id,
        title: item.title,
        price_cents: item.price_cents,
        transaction_types: item.transaction_types,
        cover_image_url: item.cover_image_url,
      }));

  const attributes: { label: string; value: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
    { label: "Condition", value: conditionLabel(listing.condition), icon: "sparkles" },
    { label: "Category", value: listing.category_path.map((c) => c.name).join(" > "), icon: "layers" },
    ...(listing.size ? [{ label: "Size", value: listing.size, icon: "ruler" as const }] : []),
    ...(listing.colour ? [{ label: "Colour", value: listing.colour, icon: "palette" as const }] : []),
    ...(listing.brand ? [{ label: "Brand", value: listing.brand, icon: "tag" as const }] : []),
    { label: "Location", value: `${regionLabel(listing.region)} Singapore`, icon: "map-pin" },
    { label: "Listed", value: relativeTime(listing.published_at ?? listing.created_at), icon: "clock" },
  ];

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-6) var(--space-12)" }}>
      <ViewTracker
        event="listing_viewed"
        properties={{ listing_id: listing.id, category: listing.category.slug, source: source ?? "direct" }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "var(--space-5)" }}>
        <ol className="t-caption" style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            <Link href="/" style={{ color: "var(--blue-link)", textDecoration: "none" }}>Home</Link>
          </li>
          {listing.category_path.map((category) => (
            <li key={category.id} style={{ display: "flex", gap: 6 }}>
              <span aria-hidden="true" style={{ color: "var(--ink-muted)" }}>&gt;</span>
              <Link href={`/buy?category=${category.slug}`} style={{ color: "var(--blue-link)", textDecoration: "none" }}>
                {category.name}
              </Link>
            </li>
          ))}
          <li style={{ display: "flex", gap: 6 }} aria-current="page">
            <span aria-hidden="true" style={{ color: "var(--ink-muted)" }}>&gt;</span>
            <span style={{ color: "var(--ink-muted)" }}>{listing.title}</span>
          </li>
        </ol>
      </nav>

      {/* 8.6 — success toast is shown by the client; the banner covers moderation. */}
      {published === "pending" || listing.status === "pending_review" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="amber" icon="clock" title="Your listing is under review">
            It will be visible to others shortly. Our team reviews flagged listings within 4 hours.
          </Banner>
        </div>
      ) : null}

      {listing.moderation_note && isOwner ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="amber" icon="shield" title="Moderation note">
            {listing.moderation_note}
          </Banner>
        </div>
      ) : null}

      <div className="tt-listing-layout">
        {/* Gallery */}
        <div className="tt-listing-gallery">
          <Gallery
            images={listing.images}
            title={listing.title}
            listingId={listing.id}
            initialSaved={listing.saved_by_viewer}
            sold={listing.status === "sold"}
          />
        </div>

        {/* Item information */}
        <div className="tt-listing-info">
          <h1 className="t-h2" style={{ margin: 0 }}>{listing.title}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
            <span className="t-price-lg">{formatPrice(listing.price_cents, listing.transaction_types)}</span>
            <Badge tone="condition">{conditionLabel(listing.condition)}</Badge>
            {listing.transaction_types.includes("trade") ? <Badge tone="trade">Open to trades</Badge> : null}
            {listing.transaction_types.includes("giveaway") ? <Badge tone="giveaway">Giveaway</Badge> : null}
          </div>

          <p className="t-caption" style={{ margin: "var(--space-2) 0 0", color: "var(--ink-muted)" }}>
            Listed {relativeTime(listing.published_at ?? listing.created_at)} · {listing.view_count} views ·{" "}
            {listing.save_count} saved
          </p>

          {listing.status === "reserved" ? (
            <div style={{ marginTop: "var(--space-4)" }}>
              <Banner tone="amber" icon="clock" title="This item is currently reserved for another buyer.">
                If that falls through it will become available again.
              </Banner>
            </div>
          ) : null}

          {/* Attribute table */}
          <dl className="tt-attributes">
            {attributes.map((attribute) => (
              <div key={attribute.label} className="tt-attribute-row">
                <dt className="t-body" style={{ color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--ink-muted)", display: "flex" }}>
                    <Icon name={attribute.icon} size={18} />
                  </span>
                  {attribute.label}
                </dt>
                <dd className="t-body-md" style={{ margin: 0, textAlign: "right" }}>{attribute.value}</dd>
              </div>
            ))}
          </dl>

          <section style={{ marginTop: "var(--space-6)" }}>
            <h2 className="t-h3">Description</h2>
            {/* Line breaks entered by the seller are preserved (8.3). */}
            <p className="t-body" style={{ color: "var(--ink-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>
              {listing.description}
            </p>
          </section>
        </div>

        {/* Seller card */}
        <aside className="tt-seller-card">
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
              <Avatar user={listing.seller} size={56} />
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/profile/${listing.seller.username}`}
                  className="t-body-md"
                  style={{ color: "var(--blue-link)", textDecoration: "none" }}
                >
                  @{listing.seller.username}
                </Link>
                <div style={{ marginTop: 2 }}>
                  <Rating average={listing.seller.rating_average} count={listing.seller.rating_count} />
                </div>
                <p className="t-caption" style={{ margin: "4px 0 0", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    aria-hidden="true"
                    style={{ width: 8, height: 8, borderRadius: "var(--radius-full)", background: "var(--green)", display: "inline-block" }}
                  />
                  {presenceLabel(listing.seller.last_active_at)}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-5)" }}>
              {isOwner ? (
                <OwnerActions listing={listing} />
              ) : (
                <ListingActions
                  listing={listing}
                  viewerRegion={user.region}
                  tradeCandidates={tradeCandidates}
                  canTransact={user.account_status === "active"}
                />
              )}
            </div>
          </div>

          <p
            className="t-caption"
            style={{
              marginTop: "var(--space-4)",
              padding: "var(--space-3)",
              background: "var(--green-subtle)",
              borderRadius: "var(--radius-md)",
              color: "#047857",
              display: "flex",
              gap: 8,
            }}
          >
            <Icon name="shield" size={16} />
            <span style={{ color: "var(--ink-secondary)" }}>
              Meet at a{" "}
              <Link href="/safety#meetup-locations" style={{ color: "var(--blue-link)" }}>
                verified location
              </Link>{" "}
              and bring a friend. Never share your address or school.
            </span>
          </p>
        </aside>
      </div>

      {/* Seller's other items */}
      {otherItems.length > 0 ? (
        <section style={{ marginTop: "var(--space-12)" }}>
          <SectionHeader
            title={`More from @${listing.seller.username}`}
            href={`/profile/${listing.seller.username}`}
          />
          <div className="grid-listings">
            {otherItems.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
