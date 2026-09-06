import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { RESERVATION_HOURS } from "@/lib/constants";
import { newId } from "@/lib/crypto";
import {
  createOffer,
  getOffer,
  getRawListing,
  listingsBySeller,
  notify,
  recordEvent,
  updateOffer,
} from "@/lib/data";
import type { Offer } from "@/lib/types";

interface CounterBody {
  offered_listing_ids?: string[] | null;
  offered_price_cents?: number | null;
  cash_topup_cents?: number | null;
  message?: string | null;
}

/**
 * 12.4 POST /offers/{id}/counter — 9.5: the seller counters by picking
 * different items from the offerer's inventory.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const original = await getOffer(id);
  if (!original) return apiError("OFFER_NOT_FOUND", "We could not find that offer.");

  const listing = await getRawListing(original.listing_id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "The listing for this offer is gone.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "Only the seller can counter this offer.");
  }
  if (original.status !== "pending") {
    return apiError("VALIDATION_FAILED", "That offer is no longer waiting for a reply.");
  }

  const body = await readJson<CounterBody>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  if (original.offer_type === "trade") {
    const wanted = body.offered_listing_ids ?? [];
    if (wanted.length === 0) {
      return apiError("VALIDATION_FAILED", "Pick which of their items you would like instead.", {
        field: "offered_listing_ids",
      });
    }
    // The counter can only ask for the offerer's own active listings.
    const theirs = new Set((await listingsBySeller(original.offerer_id, ["active", "reserved"])).map((l) => l.id));
    if (!wanted.every((wantedId) => theirs.has(wantedId))) {
      return apiError("VALIDATION_FAILED", "You can only ask for items they have listed.", {
        field: "offered_listing_ids",
      });
    }
  }

  await updateOffer(original.id, { status: "countered" });

  const now = new Date();
  // The counter is a new offer running the other way, so the original offerer
  // gets to accept or decline it.
  const counter: Offer = {
    id: newId(),
    listing_id: original.listing_id,
    offerer_id: auth.user.id,
    offer_type: original.offer_type,
    offered_price_cents: body.offered_price_cents ?? null,
    offered_listing_ids: body.offered_listing_ids ?? null,
    cash_topup_cents: body.cash_topup_cents ?? null,
    message: body.message?.slice(0, 500) ?? null,
    meetup_location_id: original.meetup_location_id,
    proposed_meetup_at: original.proposed_meetup_at,
    status: "pending",
    completed_by: [],
    expires_at: new Date(now.getTime() + RESERVATION_HOURS * 36e5).toISOString(),
    created_at: now.toISOString(),
  };
  await createOffer(counter);

  await notify(
    original.offerer_id,
    "offer",
    "You got a counter offer",
    `@${auth.user.username} countered your offer on "${listing.title}".`,
    "/trade/received",
  );

  await recordEvent("offer_responded", auth.user.id, { offer_type: original.offer_type, response: "countered" });

  return apiOk({ status: "countered", counter_offer_id: counter.id }, 201);
}
