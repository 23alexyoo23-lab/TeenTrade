import Link from "next/link";
import { SaveButton } from "./SaveButton";
import { TransactionBadges } from "./ui";
import { conditionLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { ListingWithRelations } from "@/lib/types";

/**
 * 7.2 Listing card. Used on Home, search results, category pages and
 * "Seller's other items".
 */
export function ListingCard({
  listing,
  showSave = true,
  href,
}: {
  listing: ListingWithRelations;
  showSave?: boolean;
  href?: string;
}) {
  const isSold = listing.status === "sold";
  const target = href ?? `/listing/${listing.id}`;

  return (
    <article className="tt-card" style={{ position: "relative" }}>
      <Link
        href={target}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
        aria-label={`${listing.title}, ${formatPrice(listing.price_cents, listing.transaction_types)}, ${conditionLabel(listing.condition)}`}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            background: "var(--surface-subtle)",
            borderTopLeftRadius: "var(--radius-lg)",
            borderTopRightRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {listing.cover_image_url ? (
            // 13.2 — listing images use the listing title as alt text.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.cover_image_url}
              alt={listing.title}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span className="sr-only">{listing.title}</span>
          )}

          {isSold ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(26, 29, 46, 0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="badge" style={{ background: "var(--ink)", color: "#fff", height: 28, fontSize: 13 }}>
                SOLD
              </span>
            </div>
          ) : null}
        </div>

        <div style={{ padding: 12 }}>
          <h3 className="t-body-md line-clamp-1" style={{ margin: 0, color: "var(--ink)" }}>
            {listing.title}
          </h3>
          <p className="t-price" style={{ margin: "4px 0 0" }}>
            {formatPrice(listing.price_cents, listing.transaction_types)}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 8,
              minHeight: 24,
            }}
          >
            <span className="t-caption" style={{ color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
              {conditionLabel(listing.condition)}
            </span>
            <span style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <TransactionBadges types={listing.transaction_types} />
            </span>
          </div>
        </div>
      </Link>

      {showSave && !isSold ? (
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <SaveButton
            listingId={listing.id}
            initialSaved={listing.saved_by_viewer}
            category={listing.category.slug}
          />
        </div>
      ) : null}
    </article>
  );
}

/** Skeleton used by the loading states in 8.1 and 8.2. */
export function ListingCardSkeleton() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skeleton" style={{ aspectRatio: "1 / 1", borderRadius: 0 }} />
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: "80%" }} />
        <div className="skeleton" style={{ height: 18, width: "40%" }} />
        <div className="skeleton" style={{ height: 20, width: "60%" }} />
      </div>
    </div>
  );
}
