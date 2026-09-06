import { ListingCardSkeleton } from "@/components/ListingCard";

/** Route-level loading state, shown while a server component streams in. */
export default function Loading() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <div className="skeleton" style={{ height: 36, width: 240, marginBottom: "var(--space-6)" }} />
      <div className="grid-listings">
        {Array.from({ length: 8 }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
