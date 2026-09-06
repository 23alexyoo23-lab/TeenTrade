import { apiError, apiOk, requireUser } from "@/lib/api";
import { getOffer, getRawListing, notify, recordEvent, releaseReservation, updateOffer } from "@/lib/data";

/** 12.4 POST /offers/{id}/decline */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const offer = await getOffer(id);
  if (!offer) return apiError("OFFER_NOT_FOUND", "We could not find that offer.");

  const listing = await getRawListing(offer.listing_id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "The listing for this offer is gone.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "Only the seller can decline this offer.");
  }
  if (offer.status !== "pending") {
    return apiError("VALIDATION_FAILED", "That offer is no longer waiting for a reply.");
  }

  await updateOffer(offer.id, { status: "declined" });
  // 9.4 — declining releases the reservation.
  await releaseReservation(listing.id);

  await notify(
    offer.offerer_id,
    "offer",
    "Your offer was declined",
    `@${auth.user.username} declined your offer on "${listing.title}".`,
    `/listing/${listing.id}`,
  );

  await recordEvent("offer_responded", auth.user.id, { offer_type: offer.offer_type, response: "declined" });

  return apiOk({ status: "declined" });
}
