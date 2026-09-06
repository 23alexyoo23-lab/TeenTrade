import { notFound, redirect } from "next/navigation";
import { ListingFlow } from "@/components/ListingFlow";
import { categoryPath } from "@/lib/constants";
import { currentUser } from "@/lib/auth";
import { getListing } from "@/lib/data";

export const metadata = { title: "Edit listing" };

/** Edit reuses the create flow, pre-filled from the existing listing. */
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect(`/login?next=/sell/${id}/edit`);

  const listing = await getListing(id, user.id);
  if (!listing) notFound();
  if (listing.seller_id !== user.id) redirect(`/listing/${id}`);

  const path = categoryPath(listing.category_id);
  const parent = path[0] ?? null;
  const child = path.length > 1 ? path[path.length - 1] : null;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 1080 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Edit listing</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)", marginBottom: "var(--space-6)" }}>
        Changes go through the same checks as a new listing.
      </p>

      <ListingFlow
        mode="edit"
        defaultRegion={user.region}
        initial={{
          id: listing.id,
          transactionTypes: listing.transaction_types,
          photos: listing.images.map((image) => ({
            id: image.id,
            url: image.url,
            thumbnail_url: image.thumbnail_url,
            name: "",
          })),
          draft: {
            title: listing.title,
            parentCategoryId: parent?.id ?? null,
            categoryId: child?.id ?? null,
            condition: listing.condition,
            size: listing.size ?? "",
            colour: listing.colour ?? "",
            brand: listing.brand ?? "",
            description: listing.description,
            price: listing.price_cents ? String(listing.price_cents / 100) : "",
            region: listing.region,
            acceptsOffers: listing.accepts_offers,
          },
        }}
      />
    </div>
  );
}
