import "server-only";

import {
  PER_PAGE,
  PRICE_FILTER_MAX,
  RESERVATION_HOURS,
  categoryById,
  categoryPath,
} from "./constants";
import { newId } from "./crypto";
import { maybeRow, rows, run, sb } from "./store";
import type {
  Block,
  Category,
  Condition,
  Conversation,
  Listing,
  ListingImage,
  ListingStatus,
  ListingView,
  ListingWithRelations,
  Message,
  Notification,
  Offer,
  PublicUser,
  Region,
  Report,
  Review,
  SavedItem,
  TransactionType,
  User,
} from "./types";
import type { SortOption } from "./constants";

/**
 * Every read and write against Supabase.
 *
 * These functions were synchronous when the project ran on a JSON file. They
 * are async now, which is the only change visible to callers — the filtering,
 * sorting and business rules are unchanged.
 *
 * Where a filter maps cleanly onto Postgres it is pushed into the query. The
 * rest (the search term match, category tree walking, facet counts) stays in
 * TypeScript so the behaviour is identical to the spec it was written from.
 */

/** Partial row shapes, for queries that select only the columns they need. */
type BlockPair = Pick<Block, "blocker_id" | "blocked_id">;
type MessageReadState = Pick<Message, "id" | "read_by">;

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export function toPublicUser(user: User): PublicUser {
  // 10.5 — never expose email or date of birth.
  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    region: user.region,
    rating_average: user.rating_average,
    rating_count: user.rating_count,
    last_active_at: user.last_active_at,
    created_at: user.created_at,
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  return maybeRow<User>(
    sb().from("users").select("*").eq("id", id).is("deleted_at", null).single(),
  );
}

/** Resolves the TeenTrade profile for a Clerk account. */
export async function getUserByClerkId(clerkId: string): Promise<User | undefined> {
  return maybeRow<User>(
    sb().from("users").select("*").eq("clerk_id", clerkId).is("deleted_at", null).single(),
  );
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  // Exact match, not ilike: `_` and `%` are wildcards in LIKE, and usernames are
  // allowed to contain `_`, so ilike("foo_bar") would also match "fooxbar".
  // Usernames are stored lowercase, so lowering the input is enough.
  return maybeRow<User>(
    sb()
      .from("users")
      .select("*")
      .eq("username", username.toLowerCase())
      .is("deleted_at", null)
      .single(),
  );
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Exact match for the same reason as getUserByUsername; `_` is common in
  // email local parts. Emails are stored lowercase.
  return maybeRow<User>(
    sb().from("users").select("*").eq("email", email.toLowerCase()).is("deleted_at", null).single(),
  );
}

export async function createUser(user: User): Promise<User> {
  const created = await maybeRow<User>(sb().from("users").insert(user).select().single());
  if (!created) throw new Error("Could not create the user.");
  return created;
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
  return maybeRow<User>(sb().from("users").update(patch).eq("id", id).select().single());
}

export async function touchUser(id: string): Promise<void> {
  // 11.2 — last_active_at is updated on each authenticated request.
  await run(sb().from("users").update({ last_active_at: new Date().toISOString() }).eq("id", id));
}

/** Recomputed after every new review so the seller card stays accurate. */
export async function recomputeRating(userId: string): Promise<void> {
  const reviews = await rows<Pick<Review, "rating">>(
    sb().from("reviews").select("rating").eq("subject_id", userId),
  );

  if (reviews.length === 0) {
    await run(sb().from("users").update({ rating_average: null, rating_count: 0 }).eq("id", userId));
    return;
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  await run(
    sb()
      .from("users")
      .update({
        rating_average: Math.round((total / reviews.length) * 10) / 10,
        rating_count: reviews.length,
      })
      .eq("id", userId),
  );
}

/* -------------------------------------------------------------------------- */
/* Blocking (10.3)                                                            */
/* -------------------------------------------------------------------------- */

export async function isBlockedEitherWay(a: string | null, b: string): Promise<boolean> {
  if (!a) return false;
  const blocks = await rows<BlockPair>(
    sb()
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(
        `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`,
      ),
  );
  return blocks.length > 0;
}

/**
 * Everyone the user has blocked, plus everyone who has blocked them. Fetched
 * once per query so list screens can filter without a round trip per row.
 */
export async function blockedIdsFor(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const blocks = await rows<BlockPair>(
    sb()
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
  );
  return new Set(
    blocks.map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id)),
  );
}

export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const found = await maybeRow<BlockPair>(
    sb()
      .from("blocks")
      .select("blocker_id, blocked_id")
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId)
      .single(),
  );
  return Boolean(found);
}

export async function blockUser(blockerId: string, blockedId: string): Promise<Block> {
  const block: Block = {
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_at: new Date().toISOString(),
  };
  // 10.3 — blocking is silent, so no notification is created for the blocked user.
  // The primary key makes a repeat block a no-op rather than a duplicate row.
  await run(sb().from("blocks").upsert(block, { onConflict: "blocker_id,blocked_id" }));
  return block;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await run(
    sb().from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId),
  );
}

export async function listBlockedUsers(blockerId: string): Promise<PublicUser[]> {
  const blocks = await rows<Pick<Block, "blocked_id">>(
    sb().from("blocks").select("blocked_id").eq("blocker_id", blockerId),
  );
  if (blocks.length === 0) return [];

  const users = await rows<User>(
    sb()
      .from("users")
      .select("*")
      .in("id", blocks.map((b) => b.blocked_id)),
  );
  return users.map(toPublicUser);
}

/* -------------------------------------------------------------------------- */
/* Listings                                                                   */
/* -------------------------------------------------------------------------- */

const DELETED_SELLER = (listing: Listing): PublicUser => ({
  id: listing.seller_id,
  username: "deleted_user",
  avatar_url: null,
  region: listing.region,
  rating_average: null,
  rating_count: 0,
  last_active_at: listing.created_at,
  created_at: listing.created_at,
});

const FALLBACK_CATEGORY: Category = {
  id: 10,
  slug: "other",
  name: "Other",
  parent_id: null,
  requires_size: false,
};

/**
 * Attaches sellers, images and the viewer's saved flag to a set of listings
 * using three queries no matter how many listings are passed, so list screens
 * do not fan out into a query per row.
 */
/**
 * How much image data to load.
 *
 * Photos are stored inline as base64 data URLs, so a full-size one is around a
 * megabyte. A browse page of 24 listings with ten photos each would be hundreds
 * of megabytes if every image were fetched to render a card that only shows a
 * thumbnail — so list surfaces fetch just the position-0 thumbnail, and only
 * the listing and edit screens ask for "all".
 */
export type ImageScope = "cover" | "all";

type CoverRow = Pick<ListingImage, "listing_id" | "thumbnail_url">;

export async function hydrateListings(
  listings: Listing[],
  viewerId: string | null,
  imageScope: ImageScope = "cover",
): Promise<ListingWithRelations[]> {
  if (listings.length === 0) return [];

  const listingIds = listings.map((l) => l.id);
  const sellerIds = [...new Set(listings.map((l) => l.seller_id))];

  const [sellers, images, covers, saved] = await Promise.all([
    rows<User>(sb().from("users").select("*").in("id", sellerIds)),
    imageScope === "all"
      ? rows<ListingImage>(
          sb().from("listing_images").select("*").in("listing_id", listingIds).order("position"),
        )
      : Promise.resolve([] as ListingImage[]),
    imageScope === "cover"
      ? rows<CoverRow>(
          sb()
            .from("listing_images")
            .select("listing_id, thumbnail_url")
            .in("listing_id", listingIds)
            .eq("position", 0),
        )
      : Promise.resolve([] as CoverRow[]),
    viewerId
      ? rows<Pick<SavedItem, "listing_id">>(
          sb()
            .from("saved_items")
            .select("listing_id")
            .eq("user_id", viewerId)
            .in("listing_id", listingIds),
        )
      : Promise.resolve([] as Pick<SavedItem, "listing_id">[]),
  ]);

  const sellerById = new Map(sellers.map((u) => [u.id, u]));
  const savedIds = new Set(saved.map((s) => s.listing_id));
  const coverByListing = new Map(covers.map((c) => [c.listing_id, c.thumbnail_url]));
  const imagesByListing = new Map<string, ListingImage[]>();
  for (const image of images) {
    const bucket = imagesByListing.get(image.listing_id);
    if (bucket) bucket.push(image);
    else imagesByListing.set(image.listing_id, [image]);
  }

  return listings.map((listing) => {
    const seller = sellerById.get(listing.seller_id);
    const listingImages = (imagesByListing.get(listing.id) ?? []).sort(
      (a, b) => a.position - b.position,
    );

    return {
      ...listing,
      seller: seller ? toPublicUser(seller) : DELETED_SELLER(listing),
      // Empty under the "cover" scope — list surfaces render cover_image_url.
      images: listingImages,
      cover_image_url:
        imageScope === "all"
          ? (listingImages[0]?.url ?? null)
          : (coverByListing.get(listing.id) ?? null),
      category: categoryById(listing.category_id) ?? FALLBACK_CATEGORY,
      category_path: categoryPath(listing.category_id),
      saved_by_viewer: savedIds.has(listing.id),
    };
  });
}

export async function hydrateListing(
  listing: Listing,
  viewerId: string | null,
  imageScope: ImageScope = "all",
): Promise<ListingWithRelations> {
  const [hydrated] = await hydrateListings([listing], viewerId, imageScope);
  return hydrated;
}

export async function getListing(
  id: string,
  viewerId: string | null,
): Promise<ListingWithRelations | undefined> {
  const listing = await getRawListing(id);
  if (!listing) return undefined;
  return hydrateListing(listing, viewerId);
}

export async function getRawListing(id: string): Promise<Listing | undefined> {
  return maybeRow<Listing>(
    sb().from("listings").select("*").eq("id", id).is("deleted_at", null).single(),
  );
}

export interface ListingQuery {
  q?: string;
  categoryId?: number | null;
  conditions?: Condition[];
  /** 7.5 Buy / Trade radio: all | sell | trade | sell_or_trade */
  type?: "all" | "sell" | "trade" | "sell_or_trade" | "giveaway";
  minPrice?: number | null;
  maxPrice?: number | null;
  region?: Region | "all" | null;
  sort?: SortOption;
  page?: number;
  perPage?: number;
  sellerId?: string;
  statuses?: ListingStatus[];
}

export interface ListingSearchResult {
  data: ListingWithRelations[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    facets: { all: number; buy_now: number; trade: number; giveaway: number };
  };
}

const CONDITION_RANK: Record<Condition, number> = { new: 0, like_new: 1, good: 2, fair: 3 };

function matchesQuery(listing: Listing, q: string): boolean {
  // Full-text equivalent of the (title, description, brand) index in 11.3.
  const haystack = `${listing.title} ${listing.description} ${listing.brand ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function matchesType(listing: Listing, type: ListingQuery["type"]): boolean {
  const types = listing.transaction_types;
  switch (type) {
    case "sell":
      return types.includes("sell");
    case "trade":
      return types.includes("trade");
    case "sell_or_trade":
      return types.includes("sell") && types.includes("trade");
    case "giveaway":
      return types.includes("giveaway");
    default:
      return true;
  }
}

export async function searchListings(
  query: ListingQuery,
  viewerId: string | null,
): Promise<ListingSearchResult> {
  const perPage = query.perPage ?? PER_PAGE;
  const page = Math.max(1, query.page ?? 1);
  const statuses = query.statuses ?? (["active", "reserved"] as ListingStatus[]);

  let select = sb().from("listings").select("*").is("deleted_at", null).in("status", statuses);

  if (query.sellerId) select = select.eq("seller_id", query.sellerId);
  if (query.region && query.region !== "all") select = select.eq("region", query.region);
  if (query.conditions?.length) select = select.in("condition", query.conditions);
  if (query.minPrice != null) select = select.gte("price_cents", query.minPrice * 100);
  // The slider tops out at "200+", so the maximum is only a filter below the ceiling.
  if (query.maxPrice != null && query.maxPrice < PRICE_FILTER_MAX) {
    select = select.lte("price_cents", query.maxPrice * 100);
  }

  const candidates = await rows<Listing>(select);

  // 10.3 — a blocked user's listings never appear in the blocker's results.
  const blockedIds = await blockedIdsFor(viewerId);

  let matched = candidates.filter((listing) => {
    if (blockedIds.has(listing.seller_id)) return false;
    if (query.q && !matchesQuery(listing, query.q)) return false;

    if (query.categoryId != null) {
      const path = categoryPath(listing.category_id).map((c) => c.id);
      if (!path.includes(query.categoryId)) return false;
    }

    return true;
  });

  // Facet counts (12.2 meta.facets) are computed before the type filter so the
  // tabs can show totals for the other tabs.
  const facets = {
    all: matched.length,
    buy_now: matched.filter((l) => l.transaction_types.includes("sell")).length,
    trade: matched.filter((l) => l.transaction_types.includes("trade")).length,
    giveaway: matched.filter((l) => l.transaction_types.includes("giveaway")).length,
  };

  matched = matched.filter((listing) => matchesType(listing, query.type));

  const sort = query.sort ?? "newest";
  matched.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return (a.price_cents ?? 0) - (b.price_cents ?? 0);
      case "price_desc":
        return (b.price_cents ?? 0) - (a.price_cents ?? 0);
      case "condition":
        return CONDITION_RANK[a.condition] - CONDITION_RANK[b.condition];
      default: {
        const aTime = new Date(a.published_at ?? a.created_at).getTime();
        const bTime = new Date(b.published_at ?? b.created_at).getTime();
        return bTime - aTime;
      }
    }
  });

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const data = await hydrateListings(matched.slice(start, start + perPage), viewerId);

  return {
    data,
    meta: { total, page, per_page: perPage, total_pages: totalPages, facets },
  };
}

export async function createListing(listing: Listing): Promise<Listing> {
  const created = await maybeRow<Listing>(
    sb().from("listings").insert(listing).select().single(),
  );
  if (!created) throw new Error("Could not create the listing.");
  return created;
}

export async function updateListing(
  id: string,
  patch: Partial<Listing>,
): Promise<Listing | undefined> {
  return maybeRow<Listing>(
    sb()
      .from("listings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single(),
  );
}

/** 10.6 — deleted listings are kept in soft-delete for 30 days. */
export async function softDeleteListing(id: string): Promise<void> {
  await run(
    sb()
      .from("listings")
      .update({ deleted_at: new Date().toISOString(), status: "removed" })
      .eq("id", id),
  );
}

export async function listingsBySeller(
  sellerId: string,
  statuses: ListingStatus[],
): Promise<ListingWithRelations[]> {
  const listings = await rows<Listing>(
    sb()
      .from("listings")
      .select("*")
      .eq("seller_id", sellerId)
      .is("deleted_at", null)
      .in("status", statuses)
      .order("updated_at", { ascending: false }),
  );
  return hydrateListings(listings, sellerId);
}

export async function recordView(listingId: string, viewerId: string | null): Promise<void> {
  const listing = await maybeRow<Pick<Listing, "seller_id" | "view_count">>(
    sb().from("listings").select("seller_id, view_count").eq("id", listingId).single(),
  );
  if (!listing) return;

  // Counted in Postgres so simultaneous views do not overwrite each other.
  await run(sb().rpc("increment_listing_view_count", { p_listing_id: listingId }));

  if (!viewerId || listing.seller_id === viewerId) return;

  // One row per user per listing, refreshed so "recently viewed" reorders.
  await run(
    sb()
      .from("listing_views")
      .upsert(
        { user_id: viewerId, listing_id: listingId, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,listing_id" },
      ),
  );
}

/** 8.1 — last 12 listings the user opened, most recent first. */
export async function recentlyViewed(
  userId: string,
  limit = 12,
): Promise<ListingWithRelations[]> {
  const views = await rows<Pick<ListingView, "listing_id" | "viewed_at">>(
    sb()
      .from("listing_views")
      .select("listing_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit * 3),
  );
  if (views.length === 0) return [];

  const listings = await rows<Listing>(
    sb()
      .from("listings")
      .select("*")
      .in("id", views.map((v) => v.listing_id))
      .is("deleted_at", null)
      .neq("status", "draft"),
  );

  const blockedIds = await blockedIdsFor(userId);
  const byId = new Map(listings.map((l) => [l.id, l]));

  const ordered = views
    .map((v) => byId.get(v.listing_id))
    .filter((l): l is Listing => Boolean(l))
    .filter((l) => !blockedIds.has(l.seller_id))
    .slice(0, limit);

  return hydrateListings(ordered, userId);
}

/**
 * 8.1 — most recently listed items in the user's most-viewed categories,
 * falling back to the newest listings overall when there is no history.
 */
export async function recommendedFor(
  userId: string,
  limit = 12,
): Promise<ListingWithRelations[]> {
  const [views, candidates, blockedIds] = await Promise.all([
    rows<Pick<ListingView, "listing_id">>(
      sb().from("listing_views").select("listing_id").eq("user_id", userId),
    ),
    rows<Listing>(
      sb()
        .from("listings")
        .select("*")
        .is("deleted_at", null)
        .in("status", ["active", "reserved"])
        .neq("seller_id", userId)
        .order("published_at", { ascending: false, nullsFirst: false }),
    ),
    blockedIdsFor(userId),
  ]);

  const visible = candidates.filter((l) => !blockedIds.has(l.seller_id));

  const viewedCategoryCounts = new Map<number, number>();
  if (views.length > 0) {
    const viewed = await rows<Pick<Listing, "id" | "category_id">>(
      sb()
        .from("listings")
        .select("id, category_id")
        .in("id", views.map((v) => v.listing_id)),
    );
    const categoryByListing = new Map(viewed.map((l) => [l.id, l.category_id]));

    for (const view of views) {
      const categoryId = categoryByListing.get(view.listing_id);
      if (categoryId == null) continue;
      const root = categoryPath(categoryId)[0];
      if (!root) continue;
      viewedCategoryCounts.set(root.id, (viewedCategoryCounts.get(root.id) ?? 0) + 1);
    }
  }

  const preferred = [...viewedCategoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  if (preferred.length === 0) {
    return hydrateListings(visible.slice(0, limit), userId);
  }

  const inPreferred = visible.filter((l) =>
    preferred.includes(categoryPath(l.category_id)[0]?.id ?? -1),
  );
  const inPreferredIds = new Set(inPreferred.map((l) => l.id));
  const rest = visible.filter((l) => !inPreferredIds.has(l.id));

  return hydrateListings([...inPreferred, ...rest].slice(0, limit), userId);
}

/** 12.2 GET /listings/{id}/similar — the seller's other active items. */
export async function sellerOtherItems(
  listing: Listing,
  viewerId: string | null,
  limit = 6,
): Promise<ListingWithRelations[]> {
  const others = await rows<Listing>(
    sb()
      .from("listings")
      .select("*")
      .eq("seller_id", listing.seller_id)
      .neq("id", listing.id)
      .is("deleted_at", null)
      .in("status", ["active", "reserved"])
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
  );
  return hydrateListings(others, viewerId);
}

/* -------------------------------------------------------------------------- */
/* Listing images                                                             */
/* -------------------------------------------------------------------------- */

export async function addListingImage(image: ListingImage): Promise<ListingImage> {
  const created = await maybeRow<ListingImage>(
    sb().from("listing_images").insert(image).select().single(),
  );
  if (!created) throw new Error("Could not save the image.");
  return created;
}

export async function replaceListingImages(
  listingId: string,
  images: ListingImage[],
): Promise<void> {
  await run(sb().from("listing_images").delete().eq("listing_id", listingId));
  if (images.length > 0) await run(sb().from("listing_images").insert(images));
}

export async function reorderListingImages(
  listingId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      run(
        sb()
          .from("listing_images")
          .update({ position: index })
          .eq("id", id)
          .eq("listing_id", listingId),
      ),
    ),
  );
}

export async function deleteListingImage(listingId: string, imageId: string): Promise<void> {
  await run(
    sb().from("listing_images").delete().eq("id", imageId).eq("listing_id", listingId),
  );

  // Close the gap the removed image left so positions stay 0..n-1.
  const remaining = await imagesForListing(listingId);
  await Promise.all(
    remaining.map((image, index) =>
      image.position === index
        ? Promise.resolve()
        : run(sb().from("listing_images").update({ position: index }).eq("id", image.id)),
    ),
  );
}

export async function imagesForListing(listingId: string): Promise<ListingImage[]> {
  return rows<ListingImage>(
    sb().from("listing_images").select("*").eq("listing_id", listingId).order("position"),
  );
}

/* -------------------------------------------------------------------------- */
/* Saved items                                                                */
/* -------------------------------------------------------------------------- */

export async function saveListing(userId: string, listingId: string): Promise<void> {
  // Insert-or-ignore in one statement, returning only genuinely new rows. A
  // check-then-insert would double-count the save when the same user taps twice
  // at once, or fail the second insert on the primary key.
  const inserted = await rows<Pick<SavedItem, "listing_id">>(
    sb()
      .from("saved_items")
      .upsert(
        { user_id: userId, listing_id: listingId, created_at: new Date().toISOString() },
        { onConflict: "user_id,listing_id", ignoreDuplicates: true },
      )
      .select("listing_id"),
  );
  if (inserted.length === 0) return;

  await run(sb().rpc("adjust_listing_save_count", { p_listing_id: listingId, p_delta: 1 }));
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  const removed = await rows<SavedItem>(
    sb()
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .select(),
  );
  if (removed.length === 0) return;

  await run(sb().rpc("adjust_listing_save_count", { p_listing_id: listingId, p_delta: -1 }));
}

export async function savedListings(userId: string): Promise<ListingWithRelations[]> {
  const saved = await rows<Pick<SavedItem, "listing_id" | "created_at">>(
    sb()
      .from("saved_items")
      .select("listing_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
  if (saved.length === 0) return [];

  const listings = await rows<Listing>(
    sb()
      .from("listings")
      .select("*")
      .in("id", saved.map((s) => s.listing_id))
      .is("deleted_at", null),
  );

  const blockedIds = await blockedIdsFor(userId);
  const byId = new Map(listings.map((l) => [l.id, l]));

  const ordered = saved
    .map((s) => byId.get(s.listing_id))
    .filter((l): l is Listing => Boolean(l))
    .filter((l) => !blockedIds.has(l.seller_id));

  return hydrateListings(ordered, userId);
}

/* -------------------------------------------------------------------------- */
/* Offers (9.4, 9.5)                                                          */
/* -------------------------------------------------------------------------- */

export async function createOffer(offer: Offer): Promise<Offer> {
  const created = await maybeRow<Offer>(sb().from("offers").insert(offer).select().single());
  if (!created) throw new Error("Could not create the offer.");
  return created;
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  return maybeRow<Offer>(sb().from("offers").select("*").eq("id", id).single());
}

export async function updateOffer(id: string, patch: Partial<Offer>): Promise<Offer | undefined> {
  return maybeRow<Offer>(sb().from("offers").update(patch).eq("id", id).select().single());
}

/** Offers expire 48 hours after creation unless answered (11.5). */
export async function expireStaleOffers(): Promise<void> {
  const now = new Date().toISOString();

  const stale = await rows<Offer>(
    sb()
      .from("offers")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", now)
      .select(),
  );
  if (stale.length === 0) return;

  // Anything those offers were holding goes back on sale.
  await run(
    sb()
      .from("listings")
      .update({ status: "active", reserved_until: null })
      .in("id", stale.map((o) => o.listing_id))
      .eq("status", "reserved"),
  );
}

export async function offersSentBy(userId: string): Promise<Offer[]> {
  await expireStaleOffers();
  return rows<Offer>(
    sb()
      .from("offers")
      .select("*")
      .eq("offerer_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function offersReceivedBy(userId: string): Promise<Offer[]> {
  await expireStaleOffers();

  const myListings = await rows<Pick<Listing, "id">>(
    sb().from("listings").select("id").eq("seller_id", userId),
  );
  if (myListings.length === 0) return [];

  return rows<Offer>(
    sb()
      .from("offers")
      .select("*")
      .in("listing_id", myListings.map((l) => l.id))
      .neq("offerer_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function reserveListing(listingId: string): Promise<void> {
  await run(
    sb()
      .from("listings")
      .update({
        status: "reserved",
        reserved_until: new Date(Date.now() + RESERVATION_HOURS * 36e5).toISOString(),
      })
      .eq("id", listingId),
  );
}

export async function releaseReservation(listingId: string): Promise<void> {
  await run(
    sb()
      .from("listings")
      .update({ status: "active", reserved_until: null })
      .eq("id", listingId)
      .eq("status", "reserved"),
  );
}

/* -------------------------------------------------------------------------- */
/* Conversations and messages (12.5)                                          */
/* -------------------------------------------------------------------------- */

export async function findOrCreateConversation(
  participantIds: string[],
  listingId: string | null,
  offerId: string | null,
): Promise<Conversation> {
  const sorted = [...participantIds].sort();

  let lookup = sb().from("conversations").select("*").contains("participant_ids", sorted);
  lookup = listingId === null ? lookup.is("listing_id", null) : lookup.eq("listing_id", listingId);

  const existing = (await rows<Conversation>(lookup)).find(
    (c) => c.participant_ids.length === sorted.length,
  );

  if (existing) {
    if (offerId && !existing.offer_id) {
      await run(sb().from("conversations").update({ offer_id: offerId }).eq("id", existing.id));
      return { ...existing, offer_id: offerId };
    }
    return existing;
  }

  const conversation: Conversation = {
    id: newId(),
    listing_id: listingId,
    offer_id: offerId,
    participant_ids: sorted,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const created = await maybeRow<Conversation>(
    sb().from("conversations").insert(conversation).select().single(),
  );
  return created ?? conversation;
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return maybeRow<Conversation>(sb().from("conversations").select("*").eq("id", id).single());
}

export async function conversationsFor(userId: string): Promise<Conversation[]> {
  const conversations = await rows<Conversation>(
    sb()
      .from("conversations")
      .select("*")
      .contains("participant_ids", [userId])
      .order("updated_at", { ascending: false }),
  );

  // 10.3 — blocked users cannot reach the blocker.
  const blockedIds = await blockedIdsFor(userId);
  return conversations.filter((c) =>
    c.participant_ids.every((id) => id === userId || !blockedIds.has(id)),
  );
}

export async function messagesIn(conversationId: string): Promise<Message[]> {
  return rows<Message>(
    sb()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  );
}

export async function lastMessageIn(conversationId: string): Promise<Message | undefined> {
  const [latest] = await rows<Message>(
    sb()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1),
  );
  return latest;
}

export async function unreadCountIn(conversationId: string, userId: string): Promise<number> {
  const unread = await rows<MessageReadState>(
    sb()
      .from("messages")
      .select("id, read_by")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId),
  );
  return unread.filter((m) => !m.read_by.includes(userId)).length;
}

export async function totalUnreadMessages(userId: string): Promise<number> {
  const conversations = await conversationsFor(userId);
  if (conversations.length === 0) return 0;

  const messages = await rows<MessageReadState>(
    sb()
      .from("messages")
      .select("id, read_by")
      .in("conversation_id", conversations.map((c) => c.id))
      .neq("sender_id", userId),
  );
  return messages.filter((m) => !m.read_by.includes(userId)).length;
}

export async function addMessage(message: Message): Promise<Message> {
  const created = await maybeRow<Message>(
    sb().from("messages").insert(message).select().single(),
  );
  await run(
    sb()
      .from("conversations")
      .update({ updated_at: message.created_at })
      .eq("id", message.conversation_id),
  );
  return created ?? message;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const unread = await rows<MessageReadState>(
    sb()
      .from("messages")
      .select("id, read_by")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId),
  );

  await Promise.all(
    unread
      .filter((m) => !m.read_by.includes(userId))
      .map((m) =>
        run(
          sb()
            .from("messages")
            .update({ read_by: [...m.read_by, userId] })
            .eq("id", m.id),
        ),
      ),
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export async function notify(
  userId: string,
  kind: Notification["kind"],
  title: string,
  body: string,
  href: string | null,
): Promise<Notification> {
  const notification: Notification = {
    id: newId(),
    user_id: userId,
    kind,
    title,
    body,
    href,
    read: false,
    created_at: new Date().toISOString(),
  };

  const created = await maybeRow<Notification>(
    sb().from("notifications").insert(notification).select().single(),
  );
  return created ?? notification;
}

export async function notificationsFor(userId: string): Promise<Notification[]> {
  return rows<Notification>(
    sb()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const unread = await rows<Pick<Notification, "id">>(
    sb().from("notifications").select("id").eq("user_id", userId).eq("read", false),
  );
  return unread.length;
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await run(sb().from("notifications").update({ read: true }).eq("user_id", userId));
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export async function addReview(review: Review): Promise<Review> {
  const created = await maybeRow<Review>(sb().from("reviews").insert(review).select().single());
  await recomputeRating(review.subject_id);
  return created ?? review;
}

export async function reviewsFor(
  userId: string,
): Promise<(Review & { author: PublicUser | null })[]> {
  const reviews = await rows<Review>(
    sb()
      .from("reviews")
      .select("*")
      .eq("subject_id", userId)
      .order("created_at", { ascending: false }),
  );
  if (reviews.length === 0) return [];

  const authors = await rows<User>(
    sb()
      .from("users")
      .select("*")
      .in("id", [...new Set(reviews.map((r) => r.author_id))]),
  );
  const authorById = new Map(authors.map((u) => [u.id, u]));

  return reviews.map((review) => {
    const author = authorById.get(review.author_id);
    return { ...review, author: author ? toPublicUser(author) : null };
  });
}

export async function hasReviewed(offerId: string, authorId: string): Promise<boolean> {
  const found = await maybeRow<Pick<Review, "id">>(
    sb()
      .from("reviews")
      .select("id")
      .eq("offer_id", offerId)
      .eq("author_id", authorId)
      .single(),
  );
  return Boolean(found);
}

/* -------------------------------------------------------------------------- */
/* Reports (9.6)                                                              */
/* -------------------------------------------------------------------------- */

export async function createReport(report: Report): Promise<Report> {
  const created = await maybeRow<Report>(sb().from("reports").insert(report).select().single());

  // 9.6 — three or more independent reports auto-hide the listing pending review.
  if (report.target_type === "listing") {
    const open = await rows<Pick<Report, "reporter_id">>(
      sb()
        .from("reports")
        .select("reporter_id")
        .eq("target_type", "listing")
        .eq("target_id", report.target_id)
        .in("status", ["open", "in_review"]),
    );

    const reporters = new Set(open.map((r) => r.reporter_id));
    if (reporters.size >= 3) {
      await run(
        sb()
          .from("listings")
          .update({
            status: "pending_review",
            moderation_note: "Auto-hidden after multiple reports. Under review.",
          })
          .eq("id", report.target_id)
          .neq("status", "removed"),
      );
    }
  }

  return created ?? report;
}

export async function reportsBy(userId: string): Promise<Report[]> {
  return rows<Report>(
    sb()
      .from("reports")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false }),
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics (14.1)                                                           */
/* -------------------------------------------------------------------------- */

export async function recordEvent(
  name: string,
  userId: string | null,
  properties: Record<string, unknown>,
): Promise<void> {
  await run(
    sb().from("analytics_events").insert({
      id: newId(),
      name,
      user_id: userId,
      properties,
      created_at: new Date().toISOString(),
    }),
  );
}

export type { Category, SortOption, TransactionType };
