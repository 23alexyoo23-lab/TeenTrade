import { apiError, apiOk, readJson, requireUser } from "@/lib/api";
import { getRawListing, imagesForListing, reorderListingImages } from "@/lib/data";

/** 12.3 PATCH /listings/{id}/images/reorder — body: image ids in order. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only reorder your own listing's photos.");
  }

  const body = await readJson<{ image_ids?: string[] }>(request);
  const ids = body?.image_ids ?? [];
  const existing = (await imagesForListing(id)).map((image) => image.id);

  // The list must be a permutation of the listing's images, so a stale client
  // cannot drop a photo through a reorder.
  if (ids.length !== existing.length || !ids.every((imageId) => existing.includes(imageId))) {
    return apiError("VALIDATION_FAILED", "Send every photo id for this listing, in the new order.", {
      field: "image_ids",
    });
  }

  await reorderListingImages(id, ids);
  return apiOk({ data: await imagesForListing(id) });
}
