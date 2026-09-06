import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { Badge, EmptyState } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { listingsBySeller, offersReceivedBy } from "@/lib/data";
import { formatPrice, relativeTime } from "@/lib/format";
import type { ListingStatus } from "@/lib/types";

export const metadata = { title: "My listings" };

const TABS: { id: string; label: string; statuses: ListingStatus[] }[] = [
  { id: "active", label: "Active", statuses: ["active", "reserved", "pending_review"] },
  { id: "draft", label: "Drafts", statuses: ["draft"] },
  { id: "sold", label: "Sold", statuses: ["sold"] },
];

/** My listings dashboard. Route: /sell */
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/sell");

  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  const perTab = await Promise.all(
    TABS.map(async (t) => [t.id, (await listingsBySeller(user.id, t.statuses)).length] as const),
  );
  const counts = Object.fromEntries(perTab) as Record<string, number>;

  const [listings, receivedOffers, published] = await Promise.all([
    listingsBySeller(user.id, activeTab.statuses),
    offersReceivedBy(user.id),
    listingsBySeller(user.id, ["active", "reserved", "sold"]),
  ]);

  const pendingOffers = receivedOffers.filter((offer) => offer.status === "pending");

  const totals = {
    views: published.reduce((sum, l) => sum + l.view_count, 0),
    saves: published.reduce((sum, l) => sum + l.save_count, 0),
  };

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <h1 className="t-h1" style={{ margin: 0 }}>My listings</h1>
          <p className="t-body" style={{ margin: "4px 0 0", color: "var(--ink-secondary)" }}>
            Everything you have listed, in one place.
          </p>
        </div>
        <Link href="/sell/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          List Item
        </Link>
      </div>

      {/* Summary stats */}
      <div className="tt-stat-row">
        <Stat label="Active listings" value={String(counts.active ?? 0)} icon="list" />
        <Stat label="Total views" value={String(totals.views)} icon="eye" />
        <Stat label="Times saved" value={String(totals.saves)} icon="heart" />
        <Stat
          label="Offers waiting"
          value={String(pendingOffers.length)}
          icon="swap"
          href={pendingOffers.length > 0 ? "/trade/received" : undefined}
          highlight={pendingOffers.length > 0}
        />
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Listing status" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBlock: "var(--space-6)" }}>
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/sell?tab=${item.id}`}
            role="tab"
            aria-selected={item.id === activeTab.id}
            className={`tt-tab${item.id === activeTab.id ? " is-active" : ""}`}
          >
            {item.label} ({counts[item.id] ?? 0})
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon="box"
          headline={
            activeTab.id === "draft"
              ? "No drafts saved"
              : activeTab.id === "sold"
                ? "Nothing sold yet"
                : "You have not listed anything yet"
          }
          body={
            activeTab.id === "draft"
              ? "Drafts you save while listing show up here for 30 days."
              : activeTab.id === "sold"
                ? "Items you mark as sold will appear here with their history."
                : "List your first item and it will show up here."
          }
          action={{ label: "List Item", href: "/sell/new" }}
        />
      ) : activeTab.id === "draft" ? (
        // Drafts get a row layout with a Continue action rather than a card.
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-3)" }}>
          {listings.map((listing) => (
            <li key={listing.id} className="card" style={{ padding: "var(--space-4)", display: "flex", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-subtle)",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {listing.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.cover_image_url}
                    alt={listing.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </span>

              <div style={{ flex: 1, minWidth: 180 }}>
                <p className="t-body-md" style={{ margin: 0 }}>{listing.title || "Untitled draft"}</p>
                <p className="t-caption" style={{ margin: "2px 0 0", color: "var(--ink-muted)" }}>
                  {formatPrice(listing.price_cents, listing.transaction_types)} · Saved {relativeTime(listing.updated_at)}
                </p>
              </div>

              <Link href={`/sell/${listing.id}/edit`} className="btn btn-primary btn-sm">
                Continue
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid-listings">
          {listings.map((listing) => (
            <div key={listing.id} style={{ position: "relative" }}>
              <ListingCard listing={listing} showSave={false} />
              {listing.status !== "active" ? (
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                  {listing.status === "pending_review" ? (
                    <Badge tone="amber" icon="clock">Under review</Badge>
                  ) : listing.status === "reserved" ? (
                    <Badge tone="amber" icon="clock">Reserved</Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  href,
  highlight,
}: {
  label: string;
  value: string;
  icon: Parameters<typeof Icon>[0]["name"];
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-md)",
          background: highlight ? "var(--brand-yellow-subtle)" : "var(--surface-subtle)",
          color: highlight ? "var(--amber)" : "var(--ink-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span>
        <span className="t-h3" style={{ display: "block" }}>{value}</span>
        <span className="t-caption" style={{ color: "var(--ink-muted)" }}>{label}</span>
      </span>
    </>
  );

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-4)",
    textDecoration: "none",
    color: "inherit",
  };

  return href ? (
    <Link href={href} className="card" style={style}>
      {content}
    </Link>
  ) : (
    <div className="card" style={style}>
      {content}
    </div>
  );
}
