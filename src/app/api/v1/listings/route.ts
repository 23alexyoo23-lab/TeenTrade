import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { PER_PAGE, categoryById, categoryBySlug } from "@/lib/constants";
import { newId } from "@/lib/crypto";
import { createListing, searchListings } from "@/lib/data";
import type { Condition, Listing, Region, TransactionType } from "@/lib/types";
import type { SortOption } from "@/lib/constants";

/**
 * 12.2 GET /listings — search and filter.
 * Query params: q, category, condition[], type, min_price, max_price, region,
 * sort, page, per_page.
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category");
  const category = categorySlug ? categoryBySlug(categorySlug) : undefined;

  const results = await searchListings(
    {
      q: url.searchParams.get("q") ?? undefined,
      categoryId: category?.id ?? null,
      conditions: url.searchParams.getAll("condition") as Condition[],
      type: (url.searchParams.get("type") ?? "all") as "all" | "sell" | "trade" | "sell_or_trade",
      minPrice: numberOrNull(url.searchParams.get("min_price")),
      maxPrice: numberOrNull(url.searchParams.get("max_price")),
      region: (url.searchParams.get("region") ?? "all") as Region | "all",
      sort: (url.searchParams.get("sort") ?? "newest") as SortOption,
      page: Number(url.searchParams.get("page") ?? 1) || 1,
      perPage: Math.min(Number(url.searchParams.get("per_page") ?? PER_PAGE) || PER_PAGE, 60),
    },
    auth.user.id,
  );

  // The response shape in 12.2 is a trimmed projection, not the internal row.
  return apiOk({
    data: results.data.map((listing) => ({
      id: listing.id,
      title: listing.title,
      price_cents: listing.price_cents,
      condition: listing.condition,
      transaction_types: listing.transaction_types,
      region: listing.region,
      cover_image_url: listing.cover_image_url,
      seller: {
        username: listing.seller.username,
        rating_average: listing.seller.rating_average,
        rating_count: listing.seller.rating_count,
      },
      published_at: listing.published_at,
    })),
    meta: results.meta,
  });
}

interface CreateBody {
  title?: string;
  description?: string;
  category_id?: number;
  condition?: Condition;
  size?: string | null;
  colour?: string | null;
  brand?: string | null;
  price_cents?: number | null;
  transaction_types?: TransactionType[];
  accepts_offers?: boolean;
  region?: Region;
}

/** 12.2 POST /listings — creates a draft. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const body = await readJson<CreateBody>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const now = new Date().toISOString();
  const listing: Listing = {
    id: newId(),
    seller_id: auth.user.id,
    title: (body.title ?? "").slice(0, 80),
    description: (body.description ?? "").slice(0, 1000),
    category_id: categoryById(body.category_id ?? 0) ? body.category_id! : 1001,
    condition: body.condition ?? "good",
    size: body.size ?? null,
    colour: body.colour ?? null,
    brand: body.brand ?? null,
    price_cents: body.price_cents ?? null,
    transaction_types: body.transaction_types?.length ? body.transaction_types : ["sell"],
    accepts_offers: body.accepts_offers ?? true,
    region: body.region ?? auth.user.region,
    status: "draft",
    view_count: 0,
    save_count: 0,
    moderation_note: null,
    reserved_until: null,
    published_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await createListing(listing);
  return apiOk({ id: listing.id, status: listing.status }, 201);
}

function numberOrNull(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
