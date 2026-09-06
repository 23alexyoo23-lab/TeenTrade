import { apiError, apiOk, requireUser } from "@/lib/api";
import { getRawListing, searchListings, sellerOtherItems } from "@/lib/data";

/** 12.2 GET /listings/{id}/similar — the seller's other items plus related. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");

  const sellerItems = await sellerOtherItems(listing, auth.user.id, 6);
  const { data: sameCategory } = await searchListings(
    { categoryId: listing.category_id, perPage: 12, sort: "newest" },
    auth.user.id,
  );
  const related = sameCategory.filter(
    (item) => item.id !== id && item.seller_id !== listing.seller_id,
  );

  return apiOk({
    seller_items: sellerItems,
    related: related.slice(0, 6),
  });
}
