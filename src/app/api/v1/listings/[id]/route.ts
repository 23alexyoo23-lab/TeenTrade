import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { categoryById, requiresSize } from "@/lib/constants";
import {
  getListing,
  getRawListing,
  isBlockedEitherWay,
  recordView,
  softDeleteListing,
  updateListing,
} from "@/lib/data";
import type { Condition, Listing, Region, TransactionType } from "@/lib/types";

/** 12.2 GET /listings/{id} — single listing with seller and images. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const listing = await getListing(id, auth.user.id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");

  if (listing.seller_id !== auth.user.id && await isBlockedEitherWay(auth.user.id, listing.seller_id)) {
    return apiError("USER_BLOCKED", "This listing is not available to you.");
  }

  if (listing.seller_id !== auth.user.id) await recordView(listing.id, auth.user.id);

  return apiOk(listing);
}

type PatchBody = Partial<{
  title: string;
  description: string;
  category_id: number;
  condition: Condition;
  size: string | null;
  colour: string | null;
  brand: string | null;
  price_cents: number | null;
  transaction_types: TransactionType[];
  accepts_offers: boolean;
  region: Region;
  status: Listing["status"];
}>;

/** 12.2 PATCH /listings/{id} */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only edit your own listings.");
  }

  const body = await readJson<PatchBody>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const patch: PatchBody = {};

  if (body.title !== undefined) {
    if (body.title.trim().length < 5 || body.title.trim().length > 80) {
      return apiError("VALIDATION_FAILED", "Titles are between 5 and 80 characters.", { field: "title" });
    }
    patch.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description.trim().length > 1000) {
      return apiError("VALIDATION_FAILED", "Descriptions can be up to 1000 characters.", {
        field: "description",
      });
    }
    patch.description = body.description.trim();
  }

  if (body.category_id !== undefined) {
    if (!categoryById(body.category_id)) {
      return apiError("VALIDATION_FAILED", "Choose a category from the list.", { field: "category_id" });
    }
    patch.category_id = body.category_id;
  }

  // 8.5 — size is required only for Clothing and Shoes.
  const effectiveCategory = patch.category_id ?? listing.category_id;
  if (body.size !== undefined) {
    if (requiresSize(effectiveCategory) && !body.size) {
      return apiError("VALIDATION_FAILED", "Choose a size for clothing and shoes.", { field: "size" });
    }
    patch.size = body.size;
  }

  if (body.transaction_types !== undefined) {
    const types = body.transaction_types;
    if (types.length === 0) {
      return apiError("INVALID_TRANSACTION_TYPE", "Choose how you want to pass this item on.", {
        field: "transaction_types",
      });
    }
    // 8.6 — Giveaway is mutually exclusive with Sell and Trade.
    if (types.includes("giveaway") && types.length > 1) {
      return apiError(
        "INVALID_TRANSACTION_TYPE",
        "A giveaway cannot also be for sale or trade. Choose one.",
        { field: "transaction_types" },
      );
    }
    patch.transaction_types = types;
  }

  const effectiveTypes = patch.transaction_types ?? listing.transaction_types;
  if (body.price_cents !== undefined) {
    if (effectiveTypes.includes("giveaway")) {
      patch.price_cents = null;
    } else if (effectiveTypes.includes("sell")) {
      if (body.price_cents === null || body.price_cents < 100 || body.price_cents > 500_000) {
        return apiError("VALIDATION_FAILED", "Enter a price between $1 and $5000.", { field: "price_cents" });
      }
      patch.price_cents = body.price_cents;
    } else {
      patch.price_cents = body.price_cents;
    }
  }

  if (body.condition !== undefined) patch.condition = body.condition;
  if (body.colour !== undefined) patch.colour = body.colour;
  if (body.brand !== undefined) patch.brand = body.brand?.slice(0, 40) ?? null;
  if (body.accepts_offers !== undefined) patch.accepts_offers = body.accepts_offers;
  if (body.region !== undefined) patch.region = body.region;

  // The owner can only move a listing between these states directly.
  if (body.status !== undefined) {
    if (!["active", "sold", "draft"].includes(body.status)) {
      return apiError("VALIDATION_FAILED", "That status change is not allowed.", { field: "status" });
    }
    if (body.status === "active" && listing.status === "draft") {
      return apiError("VALIDATION_FAILED", "Publish the listing from the listing flow instead.", {
        field: "status",
      });
    }
    patch.status = body.status;
    if (body.status === "sold") patch.price_cents = listing.price_cents;
  }

  const updated = await updateListing(id, patch);
  return apiOk(updated);
}

/** 12.2 DELETE /listings/{id} — soft delete, retained 30 days (10.6). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only delete your own listings.");
  }

  await softDeleteListing(id);
  return apiOk({ deleted: true });
}
