import { redirect } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { savedListings } from "@/lib/data";

export const metadata = { title: "Saved items" };

/** 5.1 Account > Saved items. */
export default async function SavedItemsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/saved");

  const listings = await savedListings(user.id);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Saved items</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)", marginBottom: "var(--space-6)" }}>
        {listings.length === 0
          ? "Tap the heart on any listing to keep it here."
          : `${listings.length} ${listings.length === 1 ? "item" : "items"} saved. Only you can see this list.`}
      </p>

      {listings.length === 0 ? (
        <EmptyState
          icon="heart"
          headline="Nothing saved yet"
          body="Tap the heart on any listing to save it for later."
          action={{ label: "Explore items", href: "/buy" }}
        />
      ) : (
        <div className="grid-listings">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
