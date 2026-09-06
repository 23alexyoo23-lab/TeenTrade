import "server-only";

import { categoryById, requiresSize } from "./constants";
import { newId } from "./crypto";
import {
  createListing,
  imagesForListing,
  listingsBySeller,
  notify,
  recordEvent,
  replaceListingImages,
  updateListing,
} from "./data";
import { moderateListing } from "./moderation";
import type { Condition, Listing, ListingImage, Region, TransactionType, User } from "./types";

export interface PublishInput {
  action?: "draft" | "publish";
  listing_id?: string | null;
  title?: string;
  description?: string;
  category_id?: number | null;
  condition?: Condition;
  size?: string | null;
  colour?: string | null;
  brand?: string | null;
  price_cents?: number | null;
  transaction_types?: TransactionType[];
  accepts_offers?: boolean;
  region?: Region;
  images?: { url: string; thumbnail_url: string }[];
}

export type PublishResult =
  | { ok: true; listing: Listing; warnings: string[] }
  | { ok: false; code: "VALIDATION_FAILED" | "INVALID_TRANSACTION_TYPE" | "PROHIBITED_ITEM"; message: string; field?: string };

/**
 * Shared by POST /listings/publish and POST /listings/{id}/publish. Validates
 * the whole listing, runs the section 10.1 moderation checks, and writes the
 * listing plus its images.
 */
export async function publishListing(
  user: User,
  input: PublishInput,
  existing: Listing | null,
): Promise<PublishResult> {
  const action = input.action ?? "publish";
  const isDraft = action === "draft";

  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();
  const categoryId = input.category_id ?? null;
  const types = input.transaction_types ?? [];
  const images = input.images ?? [];

  // Drafts are allowed to be incomplete; publishing is not.
  if (!isDraft) {
    if (title.length < 5 || title.length > 80) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Titles are between 5 and 80 characters.", field: "title" };
    }
    if (description.length < 20 || description.length > 1000) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "Descriptions are between 20 and 1000 characters.",
        field: "description",
      };
    }
    if (!categoryId || !categoryById(categoryId)) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Choose a category.", field: "category_id" };
    }
    if (requiresSize(categoryId) && !input.size) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Choose a size. Buyers filter by it.", field: "size" };
    }
    if (images.length === 0) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Add at least one photo to continue.", field: "images" };
    }
    if (images.length > 10) {
      return { ok: false, code: "VALIDATION_FAILED", message: "You have reached the 10 photo limit.", field: "images" };
    }
    if (types.length === 0) {
      return {
        ok: false,
        code: "INVALID_TRANSACTION_TYPE",
        message: "Choose whether you want to sell, trade or give this item away.",
        field: "transaction_types",
      };
    }
    // 8.6 — Giveaway is mutually exclusive with Sell and Trade.
    if (types.includes("giveaway") && types.length > 1) {
      return {
        ok: false,
        code: "INVALID_TRANSACTION_TYPE",
        message: "A giveaway cannot also be for sale or trade. Choose one.",
        field: "transaction_types",
      };
    }
  }

  const isGiveaway = types.includes("giveaway");
  const priceCents = isGiveaway ? null : (input.price_cents ?? null);

  if (!isDraft && types.includes("sell")) {
    if (priceCents === null || priceCents < 100 || priceCents > 500_000) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Enter a price between $1 and $5000.", field: "price_cents" };
    }
  }

  // 10.1 — automated checks. Duplicate detection compares cover images against
  // the seller's listings published in the last 7 days.
  const sevenDaysAgo = Date.now() - 7 * 864e5;
  const recentListings = await listingsBySeller(user.id, [
    "active",
    "reserved",
    "pending_review",
  ]);
  const recentFingerprints = recentListings
    .filter(
      (item) =>
        item.id !== existing?.id &&
        new Date(item.published_at ?? item.created_at).getTime() > sevenDaysAgo,
    )
    .map((item) => fingerprint(item.cover_image_url ?? ""));

  const moderation = moderateListing({
    title,
    description,
    priceCents,
    imageFingerprints: images.map((image) => fingerprint(image.url)),
    recentImageFingerprints: recentFingerprints,
  });

  if (moderation.outcome.decision === "reject") {
    return { ok: false, code: "PROHIBITED_ITEM", message: moderation.outcome.reason };
  }

  const status: Listing["status"] = isDraft
    ? "draft"
    : moderation.outcome.decision === "hold"
      ? "pending_review"
      : "active";

  const now = new Date().toISOString();
  let listing: Listing;

  if (existing) {
    const updated = await updateListing(existing.id, {
      title,
      // Contact details are stripped automatically (10.1).
      description: moderation.sanitisedDescription.trim(),
      category_id: categoryId ?? existing.category_id,
      condition: input.condition ?? existing.condition,
      size: input.size ?? null,
      colour: input.colour ?? null,
      brand: input.brand ?? null,
      price_cents: priceCents,
      transaction_types: types.length > 0 ? types : existing.transaction_types,
      accepts_offers: isGiveaway ? false : (input.accepts_offers ?? true),
      region: input.region ?? existing.region,
      status,
      moderation_note:
        moderation.outcome.decision === "hold" ? moderation.outcome.reason : null,
      published_at: isDraft ? existing.published_at : (existing.published_at ?? now),
    });

    if (!updated) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "We could not find that listing.",
      };
    }
    listing = updated;
  } else {
    listing = {
      id: newId(),
      seller_id: user.id,
      title,
      description: moderation.sanitisedDescription.trim(),
      category_id: categoryId ?? 1001,
      condition: input.condition ?? "good",
      size: input.size ?? null,
      colour: input.colour ?? null,
      brand: input.brand ?? null,
      price_cents: priceCents,
      transaction_types: types.length > 0 ? types : ["sell"],
      accepts_offers: isGiveaway ? false : (input.accepts_offers ?? true),
      region: input.region ?? user.region,
      status,
      view_count: 0,
      save_count: 0,
      moderation_note: moderation.outcome.decision === "hold" ? moderation.outcome.reason : null,
      reserved_until: null,
      published_at: isDraft ? null : now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await createListing(listing);
  }

  // Images are replaced wholesale; position 0 is the cover.
  if (images.length > 0) {
    const rows: ListingImage[] = images.slice(0, 10).map((image, index) => ({
      id: newId(),
      listing_id: listing.id,
      url: image.url,
      thumbnail_url: image.thumbnail_url,
      position: index,
      created_at: now,
    }));
    await replaceListingImages(listing.id, rows);
  } else if (existing && (await imagesForListing(existing.id)).length === 0 && !isDraft) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Add at least one photo to continue.", field: "images" };
  }

  if (!isDraft) {
    await recordEvent("listing_published", user.id, {
      category: listing.category_id,
      transaction_types: listing.transaction_types,
      photo_count: images.length,
      price_cents: listing.price_cents,
    });

    if (status === "pending_review") {
      await notify(
        user.id,
        "listing_status",
        "Your listing is under review",
        `"${listing.title}" is being checked by our team and will be visible shortly.`,
        `/listing/${listing.id}`,
      );
    } else {
      await notify(
        user.id,
        "listing_status",
        "Your listing is live",
        `"${listing.title}" is now visible to other teens.`,
        `/listing/${listing.id}`,
      );
    }
  }

  return { ok: true, listing, warnings: moderation.warnings };
}

/**
 * Cheap stand-in for perceptual image hashing. Uploaded images arrive as data
 * URLs, so a slice of the encoded payload is stable enough to catch the
 * "same photos re-listed" case in 10.1.
 */
function fingerprint(url: string): string {
  if (!url) return "";
  const payload = url.includes(",") ? url.slice(url.indexOf(",") + 1) : url;
  return payload.slice(0, 96);
}
