import { ListingCardSkeleton } from "@/components/ListingCard";

/** 8.2 — skeleton cards matching the grid layout, with a shimmer animation. */
export default function BuyLoading() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <div className="tt-results-layout">
        <div className="tt-filters" aria-hidden="true">
          <div className="skeleton" style={{ height: 24, width: 90, marginBottom: "var(--space-5)" }} />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} style={{ paddingBlock: "var(--space-4)", borderTop: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 44 }} />
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: 90, marginBottom: "var(--space-6)" }} />
          <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-6)" }}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton" style={{ height: 36, width: 110 }} />
            ))}
          </div>
          <div className="grid-listings grid-results">
            {Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
