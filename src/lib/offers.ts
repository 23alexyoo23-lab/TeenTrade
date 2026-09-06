import "server-only";

import { meetupLocationById } from "./constants";
import { newId } from "./crypto";
import {
  addMessage,
  findOrCreateConversation,
  getListing,
  getRawListing,
  getUserById,
  hydrateListings,
  toPublicUser,
} from "./data";
import { formatDateTime, formatPrice } from "./format";
import type { ListingWithRelations, MeetupLocation, Offer, PublicUser } from "./types";

/** An offer with everything the Trade screens need to render it. */
export interface OfferWithRelations extends Offer {
  listing: ListingWithRelations | null;
  offerer: PublicUser | null;
  seller: PublicUser | null;
  offered_listings: ListingWithRelations[];
  meetup_location: MeetupLocation | null;
}

export async function hydrateOffer(offer: Offer, viewerId: string): Promise<OfferWithRelations> {
  const listing = (await getListing(offer.listing_id, viewerId)) ?? null;
  const offerer = await getUserById(offer.offerer_id);
  const seller = listing ? await getUserById(listing.seller_id) : undefined;

  const offered = await Promise.all(
    (offer.offered_listing_ids ?? []).map((id) => getRawListing(id)),
  );
  const offeredListings = await hydrateListings(
    offered.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    viewerId,
  );

  return {
    ...offer,
    listing,
    offerer: offerer ? toPublicUser(offerer) : null,
    seller: seller ? toPublicUser(seller) : null,
    offered_listings: offeredListings,
    meetup_location: offer.meetup_location_id ? (meetupLocationById(offer.meetup_location_id) ?? null) : null,
  };
}

/** Human-readable summary used on cards and in the pinned chat message. */
export function describeOffer(offer: OfferWithRelations): string {
  switch (offer.offer_type) {
    case "purchase":
      return offer.listing?.price_cents === null
        ? "Wants to collect this giveaway"
        : `Wants to buy at ${formatPrice(offer.listing?.price_cents ?? null)}`;
    case "price_offer":
      return `Offered ${formatPrice(offer.offered_price_cents)}`;
    case "trade": {
      const items = offer.offered_listings.map((item) => item.title);
      const topup = offer.cash_topup_cents
        ? ` plus ${formatPrice(offer.cash_topup_cents)} cash`
        : "";
      return items.length > 0 ? `Offering ${items.join(", ")}${topup}` : `Offering a trade${topup}`;
    }
  }
}

/**
 * 9.4 / 9.5 — accepting an offer opens a conversation with the meetup details
 * pinned at the top.
 */
export async function openConversationForOffer(
  offer: OfferWithRelations,
  sellerId: string,
): Promise<string> {
  const conversation = await findOrCreateConversation(
    [sellerId, offer.offerer_id],
    offer.listing_id,
    offer.id,
  );

  const parts: string[] = [
    offer.offer_type === "trade" ? "Trade offer accepted." : "Purchase request accepted.",
  ];

  if (offer.offer_type === "trade" && offer.offered_listings.length > 0) {
    parts.push(
      `Swapping "${offer.listing?.title ?? "this item"}" for ${offer.offered_listings
        .map((item) => `"${item.title}"`)
        .join(", ")}${offer.cash_topup_cents ? ` plus ${formatPrice(offer.cash_topup_cents)} cash` : ""}.`,
    );
  }
  if (offer.offer_type === "price_offer") {
    parts.push(`Agreed price: ${formatPrice(offer.offered_price_cents)}.`);
  }
  if (offer.meetup_location) {
    parts.push(`Meeting at ${offer.meetup_location.name} (${offer.meetup_location.nearest_mrt}).`);
  }
  if (offer.proposed_meetup_at) {
    parts.push(`Proposed time: ${formatDateTime(offer.proposed_meetup_at)}.`);
  }
  parts.push(
    "TeenTrade does not handle payments. You arrange payment directly with the other person when you meet.",
  );

  await addMessage({
    id: newId(),
    conversation_id: conversation.id,
    sender_id: sellerId,
    body: parts.join(" "),
    redacted: false,
    kind: "system",
    read_by: [sellerId],
    created_at: new Date().toISOString(),
  });

  return conversation.id;
}
