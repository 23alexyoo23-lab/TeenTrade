import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { RESERVATION_HOURS, meetupLocationById } from "@/lib/constants";
import { newId } from "@/lib/crypto";
import {
  createOffer,
  getRawListing,
  isBlockedEitherWay,
  listingsBySeller,
  notify,
  recordEvent,
  reserveListing,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Offer, OfferType } from "@/lib/types";

interface OfferBody {
  offer_type?: OfferType;
  offered_price_cents?: number | null;
  offered_listing_ids?: string[] | null;
  cash_topup_cents?: number | null;
  message?: string | null;
  meetup_location_id?: number | null;
  proposed_meetup_at?: string | null;
}

/** 12.4 POST /listings/{id}/offers — purchase, price or trade offer (9.4, 9.5). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");

  if (listing.seller_id === auth.user.id) {
    return apiError("VALIDATION_FAILED", "You cannot make an offer on your own listing.");
  }
  if (await isBlockedEitherWay(auth.user.id, listing.seller_id)) {
    return apiError("USER_BLOCKED", "This listing is not available to you.");
  }
  if (listing.status === "sold") {
    return apiError("VALIDATION_FAILED", "This item has already been sold.");
  }
  if (listing.status === "reserved") {
    return apiError("LISTING_ALREADY_RESERVED", "This item is reserved for another buyer right now.");
  }
  if (listing.status !== "active") {
    return apiError("VALIDATION_FAILED", "This listing is not accepting offers.");
  }

  const body = await readJson<OfferBody>(request);
  if (!body?.offer_type) {
    return apiError("VALIDATION_FAILED", "We could not read that request.", { field: "offer_type" });
  }

  const offerType = body.offer_type;

  // Type-specific validation.
  if (offerType === "price_offer") {
    if (!listing.accepts_offers) {
      return apiError("VALIDATION_FAILED", "This seller is not taking offers on this item.");
    }
    if (!listing.transaction_types.includes("sell")) {
      return apiError("INVALID_TRANSACTION_TYPE", "This listing is not for sale.");
    }
    const amount = body.offered_price_cents ?? 0;
    if (amount < 100 || amount > 500_000) {
      return apiError("VALIDATION_FAILED", "Offer between $1 and $5000.", { field: "offered_price_cents" });
    }
  }

  if (offerType === "trade") {
    if (!listing.transaction_types.includes("trade")) {
      return apiError("INVALID_TRANSACTION_TYPE", "This listing is not open to trades.");
    }
    const offered = body.offered_listing_ids ?? [];
    if (offered.length === 0) {
      return apiError("VALIDATION_FAILED", "Choose at least one of your items to offer.", {
        field: "offered_listing_ids",
      });
    }
    if (offered.length > 3) {
      return apiError("VALIDATION_FAILED", "You can offer up to 3 items in one trade.", {
        field: "offered_listing_ids",
      });
    }
    // 9.5 — the offered items must be the offerer's own active listings.
    const mine = new Set((await listingsBySeller(auth.user.id, ["active"])).map((l) => l.id));
    if (!offered.every((offeredId) => mine.has(offeredId))) {
      return apiError("VALIDATION_FAILED", "You can only offer your own active listings.", {
        field: "offered_listing_ids",
      });
    }
  }

  if (offerType === "purchase") {
    if (!listing.transaction_types.includes("sell") && !listing.transaction_types.includes("giveaway")) {
      return apiError("INVALID_TRANSACTION_TYPE", "This listing is not for sale.");
    }
    if (!body.meetup_location_id || !meetupLocationById(body.meetup_location_id)) {
      return apiError("VALIDATION_FAILED", "Choose a verified meetup location.", {
        field: "meetup_location_id",
      });
    }
  }

  const now = new Date();
  const offer: Offer = {
    id: newId(),
    listing_id: listing.id,
    offerer_id: auth.user.id,
    offer_type: offerType,
    offered_price_cents: offerType === "price_offer" ? (body.offered_price_cents ?? null) : null,
    offered_listing_ids: offerType === "trade" ? (body.offered_listing_ids ?? null) : null,
    cash_topup_cents: offerType === "trade" ? (body.cash_topup_cents ?? null) : null,
    message: body.message?.slice(0, 500) ?? null,
    meetup_location_id: body.meetup_location_id ?? null,
    proposed_meetup_at: body.proposed_meetup_at ?? null,
    status: "pending",
    completed_by: [],
    expires_at: new Date(now.getTime() + RESERVATION_HOURS * 36e5).toISOString(),
    created_at: now.toISOString(),
  };

  await createOffer(offer);

  // 9.4 — a purchase request holds the listing for 48 hours.
  if (offerType === "purchase") await reserveListing(listing.id);

  await notify(
    listing.seller_id,
    "offer",
    offerType === "trade" ? "New trade offer" : offerType === "purchase" ? "New purchase request" : "New offer",
    offerType === "trade"
      ? `@${auth.user.username} offered a trade for "${listing.title}".`
      : offerType === "purchase"
        ? `@${auth.user.username} wants to buy "${listing.title}".`
        : `@${auth.user.username} offered ${formatPrice(offer.offered_price_cents)} for "${listing.title}".`,
    "/trade/received",
  );

  await recordEvent("offer_sent", auth.user.id, { offer_type: offerType, listing_id: listing.id });

  return apiOk({ id: offer.id, status: offer.status, expires_at: offer.expires_at }, 201);
}
