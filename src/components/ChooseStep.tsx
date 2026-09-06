"use client";

import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { conditionLabel, regionLabel, TRANSACTION_OPTIONS, categoryPath } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { ProcessedImage } from "@/lib/images";
import type { TransactionType } from "@/lib/types";
import type { ListingDraft } from "./DetailsForm";

const OPTION_STYLE: Record<TransactionType, { icon: IconName; bg: string; fg: string }> = {
  sell: { icon: "bag", bg: "var(--blue-subtle)", fg: "var(--blue-primary)" },
  trade: { icon: "swap", bg: "var(--green-subtle)", fg: "#047857" },
  giveaway: { icon: "gift", bg: "var(--brand-yellow-subtle)", fg: "var(--amber)" },
};

/** 8.6 Create listing, step 3 (Choose). */
export function ChooseStep({
  selected,
  onChange,
  draft,
  photos,
}: {
  selected: TransactionType[];
  onChange: (types: TransactionType[]) => void;
  draft: ListingDraft;
  photos: ProcessedImage[];
}) {
  function toggle(type: TransactionType) {
    // Giveaway is mutually exclusive with Sell and Trade; Sell and Trade can
    // be combined into a "Sell or Trade" listing.
    if (type === "giveaway") {
      onChange(selected.includes("giveaway") ? [] : ["giveaway"]);
      return;
    }

    const withoutGiveaway = selected.filter((t) => t !== "giveaway");
    onChange(
      withoutGiveaway.includes(type)
        ? withoutGiveaway.filter((t) => t !== type)
        : [...withoutGiveaway, type],
    );
  }

  const isGiveaway = selected.includes("giveaway");
  const categoryId = draft.categoryId ?? draft.parentCategoryId;
  const categoryLabel = categoryId
    ? categoryPath(categoryId).map((c) => c.name).join(" > ")
    : "Not set";

  const attributes: { icon: IconName; label: string; value: string }[] = [
    { icon: "layers", label: "Category", value: categoryLabel },
    { icon: "ruler", label: "Size", value: draft.size || "Not applicable" },
    { icon: "palette", label: "Colour", value: draft.colour || "Not set" },
    { icon: "sparkles", label: "Condition", value: conditionLabel(draft.condition) },
    { icon: "map-pin", label: "Location", value: `${regionLabel(draft.region)} Singapore` },
  ];

  const priceCents = isGiveaway ? null : draft.price ? Math.round(Number(draft.price) * 100) : null;
  // Sell selected with no price yet: prompt rather than showing a price.
  const priceMissing = selected.includes("sell") && priceCents === null;

  return (
    <>
      <div className="tt-choose-columns">
        {/* Left: transaction type */}
        <section>
          <h2 className="t-h3" style={{ marginTop: 0 }}>I want to&hellip;</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {TRANSACTION_OPTIONS.map((option) => {
              const style = OPTION_STYLE[option.value];
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`tt-option-card${checked ? " is-selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.value)}
                    aria-describedby={`option-${option.value}-description`}
                  />
                  <span className="tt-option-icon" style={{ background: style.bg, color: style.fg }}>
                    <Icon name={style.icon} size={22} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="t-body-md" style={{ display: "block" }}>{option.title}</span>
                    <span
                      id={`option-${option.value}-description`}
                      className="t-caption"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {selected.includes("sell") && selected.includes("trade") ? (
            <p
              className="t-caption"
              style={{
                marginTop: "var(--space-4)",
                padding: "var(--space-3)",
                background: "var(--purple-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--purple-text)",
              }}
            >
              This will be a &quot;Sell or Trade&quot; listing. Buyers can pay your price, or offer you an item.
            </p>
          ) : null}

          {isGiveaway ? (
            <p
              className="t-caption"
              style={{
                marginTop: "var(--space-4)",
                padding: "var(--space-3)",
                background: "var(--brand-yellow-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--amber)",
              }}
            >
              Giveaways are free, so the price you entered has been cleared.
            </p>
          ) : null}

          <p className="t-caption" style={{ marginTop: "var(--space-5)", color: "var(--ink-muted)" }}>
            Before you publish, check your item is not on the{" "}
            <Link href="/safety/prohibited-items" style={{ color: "var(--blue-link)" }}>
              prohibited items list
            </Link>
            .
          </p>
        </section>

        {/* Right: live review panel */}
        <section>
          <h2 className="t-h3" style={{ marginTop: 0 }}>Review your listing</h2>

          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <span
              style={{
                width: 240,
                height: 240,
                borderRadius: "var(--radius-lg)",
                background: "var(--surface-subtle)",
                border: "1px solid var(--border)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].thumbnail_url}
                  alt={draft.title || "Cover photo"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </span>

            <div style={{ flex: 1, minWidth: 220 }}>
              <h3 className="t-h3" style={{ margin: 0 }}>{draft.title || "Untitled listing"}</h3>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
                <span
                  className="t-price-lg"
                  style={priceMissing ? { color: "var(--red)", fontSize: 20 } : undefined}
                >
                  {priceMissing ? "Add a price in step 2" : formatPrice(priceCents, selected)}
                </span>
                <span className="badge badge-condition">{conditionLabel(draft.condition)}</span>
              </div>

              <dl style={{ margin: "var(--space-5) 0 0", padding: 0 }}>
                {attributes.map((attribute) => (
                  <div
                    key={attribute.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-4)",
                      minHeight: 32,
                    }}
                  >
                    <dt
                      className="t-body"
                      style={{ color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ color: "var(--ink-muted)", display: "flex" }}>
                        <Icon name={attribute.icon} size={18} />
                      </span>
                      {attribute.label}
                    </dt>
                    <dd className="t-body-md" style={{ margin: 0, textAlign: "right" }}>
                      {attribute.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </div>

      {/* Info banner */}
      <div
        style={{
          marginTop: "var(--space-6)",
          background: "var(--blue-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          display: "flex",
          gap: "var(--space-3)",
        }}
      >
        <span style={{ color: "var(--blue-primary)", flexShrink: 0 }}>
          <Icon name="info" size={20} />
        </span>
        <div>
          <p className="t-body-md" style={{ margin: 0, color: "var(--blue-primary)" }}>
            What happens next?
          </p>
          <p className="t-body" style={{ margin: "2px 0 0", color: "var(--ink-secondary)" }}>
            Your listing will be published and visible to other teens. You can manage or edit your listing
            anytime in My Listings.
          </p>
        </div>
      </div>
    </>
  );
}
