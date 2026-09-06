import { apiError, apiOk, requireActive, requireUser } from "@/lib/api";
import {
  getOffer,
  getRawListing,
  notify,
  recordEvent,
  reserveListing,
  updateListing,
  updateOffer,
} from "@/lib/data";
import { hydrateOffer, openConversationForOffer } from "@/lib/offers";

/** 12.4 POST /offers/{id}/accept — opens a conversation (9.4, 9.5). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const offer = await getOffer(id);
  if (!offer) return apiError("OFFER_NOT_FOUND", "We could not find that offer.");

  const listing = await getRawListing(offer.listing_id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "The listing for this offer is gone.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "Only the seller can accept this offer.");
  }
  if (offer.status !== "pending") {
    return apiError("VALIDATION_FAILED", "That offer is no longer waiting for a reply.");
  }

  await updateOffer(offer.id, { status: "accepted" });
  await reserveListing(listing.id);

  // Any other pending offer on this listing is released.
  const hydrated = await hydrateOffer({ ...offer, status: "accepted" }, auth.user.id);
  const conversationId = await openConversationForOffer(hydrated, auth.user.id);

  await notify(
    offer.offerer_id,
    "offer",
    "Your offer was accepted",
    `@${auth.user.username} accepted your offer on "${listing.title}". Meetup details are in your messages.`,
    `/messages/${conversationId}`,
  );

  await recordEvent("offer_responded", auth.user.id, { offer_type: offer.offer_type, response: "accepted" });

  // Keep the listing reserved rather than sold until both sides confirm (9.4).
  await updateListing(listing.id, { status: "reserved" });

  return apiOk({ status: "accepted", conversation_id: conversationId });
}
