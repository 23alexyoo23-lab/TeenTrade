"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Icon } from "./Icon";
import { CONDITIONS, PRICE_FILTER_MAX, REGIONS, TOP_CATEGORIES } from "@/lib/constants";
import { track } from "@/lib/analytics";

/**
 * 7.5 Filter panel. Filters apply immediately on change with no Apply button,
 * and every change is written into the URL query string so the state is
 * shareable, refresh-safe and back-navigable (15.2).
 */
export function FilterPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const conditions = params.getAll("condition");
  const type = params.get("type") ?? "all";
  const region = params.get("region") ?? "all";
  const minPrice = Number(params.get("min_price") ?? 0);
  const maxPrice = Number(params.get("max_price") ?? PRICE_FILTER_MAX);

  // Slider handles move locally for smoothness, then commit on release.
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const commit = useCallback(
    (mutateParams: (next: URLSearchParams) => void, eventName: string, eventValue: unknown) => {
      const next = new URLSearchParams(params.toString());
      mutateParams(next);
      // Any filter change resets to the first page.
      next.delete("page");
      track("filter_applied", { filter_name: eventName, filter_value: eventValue });
      router.push(`/buy?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  function clearAll() {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    setLocalMin(0);
    setLocalMax(PRICE_FILTER_MAX);
    router.push(`/buy${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const hasFilters =
    Boolean(category) || conditions.length > 0 || type !== "all" || region !== "all" ||
    minPrice > 0 || maxPrice < PRICE_FILTER_MAX;

  return (
    <div className="tt-filters">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: "var(--space-5)",
        }}
      >
        <h2 className="t-h3" style={{ margin: 0 }}>Filters</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearAll}
            disabled={!hasFilters}
            style={{ paddingInline: 8 }}
          >
            Clear all
          </button>
          {onClose ? (
            <button type="button" className="tt-icon-button" onClick={onClose} aria-label="Close filters">
              <Icon name="x" size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Category */}
      <FilterGroup label="Category" htmlFor="filter-category">
        <select
          id="filter-category"
          className="select"
          value={category}
          onChange={(event) =>
            commit((next) => {
              if (event.target.value) next.set("category", event.target.value);
              else next.delete("category");
            }, "category", event.target.value || "all")
          }
        >
          <option value="">All Categories</option>
          {TOP_CATEGORIES.map((option) => (
            <option key={option.id} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Price — dual handle range, SGD 0 to 200+, step 5 */}
      <FilterGroup label="Price">
        <p className="t-caption" style={{ color: "var(--ink-muted)", margin: "0 0 8px" }}>
          ${localMin} to ${localMax >= PRICE_FILTER_MAX ? `${PRICE_FILTER_MAX}+` : localMax}
        </p>
        <div className="tt-range">
          <input
            type="range"
            aria-label="Minimum price"
            min={0}
            max={PRICE_FILTER_MAX}
            step={5}
            value={localMin}
            onChange={(event) => setLocalMin(Math.min(Number(event.target.value), localMax))}
            onMouseUp={() => commitPrice()}
            onTouchEnd={() => commitPrice()}
            onKeyUp={() => commitPrice()}
          />
          <input
            type="range"
            aria-label="Maximum price"
            min={0}
            max={PRICE_FILTER_MAX}
            step={5}
            value={localMax}
            onChange={(event) => setLocalMax(Math.max(Number(event.target.value), localMin))}
            onMouseUp={() => commitPrice()}
            onTouchEnd={() => commitPrice()}
            onKeyUp={() => commitPrice()}
          />
        </div>
      </FilterGroup>

      {/* Condition */}
      <FilterGroup label="Condition">
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="sr-only">Condition</legend>
          {CONDITIONS.map((option) => {
            const checked = conditions.includes(option.value);
            return (
              <label key={option.value} className="tt-check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    commit((next) => {
                      const current = next.getAll("condition");
                      next.delete("condition");
                      const updated = checked
                        ? current.filter((c) => c !== option.value)
                        : [...current, option.value];
                      updated.forEach((value) => next.append("condition", value));
                    }, "condition", option.value)
                  }
                />
                <span className="t-body">{option.label}</span>
              </label>
            );
          })}
        </fieldset>
      </FilterGroup>

      {/* Buy / Trade */}
      <FilterGroup label="Buy / Trade">
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="sr-only">Transaction type</legend>
          {[
            { value: "all", label: "All" },
            { value: "sell", label: "Buy Now" },
            { value: "trade", label: "Trade" },
            { value: "sell_or_trade", label: "Sell or Trade" },
          ].map((option) => (
            <label key={option.value} className="tt-check-row">
              <input
                type="radio"
                name="filter-type"
                checked={type === option.value}
                onChange={() =>
                  commit((next) => {
                    if (option.value === "all") next.delete("type");
                    else next.set("type", option.value);
                  }, "type", option.value)
                }
              />
              <span className="t-body">{option.label}</span>
            </label>
          ))}
        </fieldset>
      </FilterGroup>

      {/* Location */}
      <FilterGroup label="Location" htmlFor="filter-region">
        <select
          id="filter-region"
          className="select"
          value={region}
          onChange={(event) =>
            commit((next) => {
              if (event.target.value === "all") next.delete("region");
              else next.set("region", event.target.value);
            }, "region", event.target.value)
          }
        >
          <option value="all">Singapore</option>
          {REGIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={clearAll}
        disabled={!hasFilters}
        style={{ paddingInline: 8, marginTop: "var(--space-2)" }}
      >
        <Icon name="refresh" size={14} />
        Reset filters
      </button>
    </div>
  );

  function commitPrice() {
    commit(
      (next) => {
        if (localMin > 0) next.set("min_price", String(localMin));
        else next.delete("min_price");
        if (localMax < PRICE_FILTER_MAX) next.set("max_price", String(localMax));
        else next.delete("max_price");
      },
      "price",
      `${localMin}-${localMax}`,
    );
  }
}

function FilterGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBlock: "var(--space-4)", borderTop: "1px solid var(--border)" }}>
      {htmlFor ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <p className="field-label">{label}</p>
      )}
      {children}
    </div>
  );
}
