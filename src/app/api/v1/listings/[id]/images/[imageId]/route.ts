import { apiError, apiOk, requireUser } from "@/lib/api";
import { deleteListingImage, getRawListing, imagesForListing } from "@/lib/data";

/** 12.3 DELETE /listings/{id}/images/{imageId} */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id, imageId } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only remove photos from your own listings.");
  }

  // A published listing must keep at least one photo.
  const existing = await imagesForListing(id);
  if (listing.status !== "draft" && existing.length <= 1) {
    return apiError("VALIDATION_FAILED", "A published listing needs at least one photo.", {
      field: "images",
    });
  }

  await deleteListingImage(id, imageId);
  return apiOk({ deleted: true, data: await imagesForListing(id) });
}
