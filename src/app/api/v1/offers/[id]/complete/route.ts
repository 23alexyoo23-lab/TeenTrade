import { apiError, apiOk, requireUser } from "@/lib/api";
import {
  getOffer,
  getRawListing,
  notify,
  recordEvent,
  updateListing,
  updateOffer,
} from "@/lib/data";

/**
 * 12.4 POST /offers/{id}/complete — 9.4: on mutual confirmation the listing is
 * marked sold and both users are prompted to leave a review.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const offer = await getOffer(id);
  if (!offer) return apiError("OFFER_NOT_FOUND", "We could not find that offer.");

  const listing = await getRawListing(offer.listing_id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "The listing for this offer is gone.");

  const isSeller = listing.seller_id === auth.user.id;
  const isOfferer = offer.offerer_id === auth.user.id;
  if (!isSeller && !isOfferer) {
    return apiError("NOT_LISTING_OWNER", "You are not part of this transaction.");
  }
  if (offer.status !== "accepted" && offer.status !== "completed") {
    return apiError("VALIDATION_FAILED", "Confirm the handover only after the offer has been accepted.");
  }

  const confirmed = Array.from(new Set([...offer.completed_by, auth.user.id]));
  const otherParty = isSeller ? offer.offerer_id : listing.seller_id;
  const bothConfirmed = confirmed.includes(listing.seller_id) && confirmed.includes(offer.offerer_id);

  await updateOffer(offer.id, {
    completed_by: confirmed,
    status: bothConfirmed ? "completed" : offer.status,
  });

  if (bothConfirmed) {
    await updateListing(listing.id, { status: "sold", reserved_until: null });

    const days = Math.max(
      0,
      Math.round((Date.now() - new Date(offer.created_at).getTime()) / 864e5),
    );
    await recordEvent("transaction_completed", auth.user.id, {
      offer_type: offer.offer_type,
      days_from_offer_to_completion: days,
    });

    for (const participant of [listing.seller_id, offer.offerer_id]) {
      await notify(
        participant,
        "review",
        "How did it go?",
        `Leave a review for your ${offer.offer_type === "trade" ? "trade" : "sale"} of "${listing.title}".`,
        `/trade/${offer.id}`,
      );
    }
  } else {
    await notify(
      otherParty,
      "offer",
      "Confirm the handover",
      `@${auth.user.username} says the handover for "${listing.title}" is done. Confirm to close it off.`,
      `/trade/${offer.id}`,
    );
  }

  return apiOk({ status: bothConfirmed ? "completed" : "awaiting_other_party", confirmed_by: confirmed });
}
