import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { newId } from "@/lib/crypto";
import { addListingImage, getRawListing, imagesForListing } from "@/lib/data";
import { MAX_PHOTOS } from "@/lib/images";

/** 12.3 POST /listings/{id}/images — attach an uploaded image to a listing. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only add photos to your own listings.");
  }

  const existing = await imagesForListing(id);
  if (existing.length >= MAX_PHOTOS) {
    return apiError("VALIDATION_FAILED", "You have reached the 10 photo limit.", { field: "images" });
  }

  const body = await readJson<{ url?: string; thumbnail_url?: string }>(request);
  if (!body?.url || !body.thumbnail_url) {
    return apiError("VALIDATION_FAILED", "We could not read that image.", { field: "url" });
  }

  const image = await addListingImage({
    id: newId(),
    listing_id: id,
    url: body.url,
    thumbnail_url: body.thumbnail_url,
    position: existing.length,
    created_at: new Date().toISOString(),
  });

  return apiOk(image, 201);
}
