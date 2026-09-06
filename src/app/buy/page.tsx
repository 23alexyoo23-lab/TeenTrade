import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { MobileFilters } from "@/components/MobileFilters";
import { Pagination } from "@/components/Pagination";
import { ResultTabs } from "@/components/ResultTabs";
import { SortSelect } from "@/components/SortSelect";
import { EmptyState } from "@/components/ui";
import { ViewTracker } from "@/components/ViewTracker";
import { PER_PAGE, PRICE_FILTER_MAX, categoryBySlug, type SortOption } from "@/lib/constants";
import { currentUser } from "@/lib/auth";
import { searchListings } from "@/lib/data";
import type { Condition, Region } from "@/lib/types";

export const metadata = { title: "Browse items" };

type SearchParams = Record<string, string | string[] | undefined>;

/** 8.2 Search results. Route: /buy?q={query} */
export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/buy");

  const params = await searchParams;
  const query = first(params.q) ?? "";
  const categorySlug = first(params.category) ?? "";
  const category = categorySlug ? categoryBySlug(categorySlug) : undefined;
  const type = (first(params.type) ?? "all") as "all" | "sell" | "trade" | "sell_or_trade" | "giveaway";
  const sort = (first(params.sort) ?? "newest") as SortOption;
  const region = (first(params.region) ?? "all") as Region | "all";
  const page = Math.max(1, Number(first(params.page) ?? 1) || 1);
  const conditions = all(params.condition) as Condition[];
  const minPrice = params.min_price ? Number(first(params.min_price)) : null;
  const maxPrice = params.max_price ? Number(first(params.max_price)) : null;

  const results = await searchListings(
    {
      q: query || undefined,
      categoryId: category?.id ?? null,
      conditions,
      type,
      minPrice,
      maxPrice,
      region,
      sort,
      page,
      perPage: PER_PAGE,
    },
    user.id,
  );

  const heading = query
    ? `Results for "${query}"`
    : category
      ? category.name
      : "Browse everything";

  function buildHref(overrides: Record<string, string | null>): string {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (categorySlug) next.set("category", categorySlug);
    if (type !== "all") next.set("type", type);
    if (sort !== "newest") next.set("sort", sort);
    if (region !== "all") next.set("region", region);
    if (minPrice) next.set("min_price", String(minPrice));
    if (maxPrice && maxPrice < PRICE_FILTER_MAX) next.set("max_price", String(maxPrice));
    conditions.forEach((condition) => next.append("condition", condition));
    if (page > 1) next.set("page", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }

    const qs = next.toString();
    return qs ? `/buy?${qs}` : "/buy";
  }

  const hasFilters =
    Boolean(categorySlug) || conditions.length > 0 || type !== "all" || region !== "all" ||
    Boolean(minPrice) || (maxPrice !== null && maxPrice < PRICE_FILTER_MAX);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      {query ? <ViewTracker event="search_performed" properties={{ query, result_count: results.meta.total, filters_applied: hasFilters }} /> : null}

      <div className="tt-results-layout">
        <Suspense fallback={<div className="tt-filters" style={{ height: 480 }} />}>
          <FilterPanel />
        </Suspense>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Suspense fallback={null}>
            <MobileFilters />
          </Suspense>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              marginBottom: "var(--space-5)",
            }}
          >
            <div>
              <h1 className="t-h2" style={{ margin: 0 }}>{heading}</h1>
              <p className="t-caption" style={{ margin: "4px 0 0", color: "var(--ink-muted)" }}>
                {results.meta.total} {results.meta.total === 1 ? "result" : "results"}
              </p>
            </div>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <div style={{ marginBottom: "var(--space-6)" }}>
            <ResultTabs
              active={type}
              facets={results.meta.facets}
              buildHref={(value) => buildHref({ type: value === "all" ? null : value, page: null })}
            />
          </div>

          {results.data.length === 0 ? (
            <EmptyState
              icon="search"
              headline="No items match your search"
              body="Try removing a filter or searching for something else."
              action={{ label: "Clear all filters", href: query ? `/buy?q=${encodeURIComponent(query)}` : "/buy" }}
            />
          ) : (
            <>
              <div className="grid-listings grid-results">
                {results.data.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              <Pagination
                page={results.meta.page}
                totalPages={results.meta.total_pages}
                buildHref={(target) => buildHref({ page: target === 1 ? null : String(target) })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Skeleton grid shown while the results stream in (8.2). */
export function ResultsSkeleton() {
  return (
    <div className="grid-listings grid-results">
      {Array.from({ length: 8 }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
