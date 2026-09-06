"use client";

import {
  COLOURS,
  CONDITIONS,
  REGIONS,
  TOP_CATEGORIES,
  childCategories,
  requiresSize,
  sizeOptions,
} from "@/lib/constants";
import type { Condition, Region } from "@/lib/types";

export interface ListingDraft {
  title: string;
  parentCategoryId: number | null;
  categoryId: number | null;
  condition: Condition;
  size: string;
  colour: string;
  brand: string;
  description: string;
  price: string;
  region: Region;
  acceptsOffers: boolean;
}

export type DraftErrors = Partial<Record<keyof ListingDraft, string>>;

const MAX_DESCRIPTION = 1000;
const MIN_DESCRIPTION = 20;

/** 8.5 Create listing, step 2 (Details). */
export function DetailsForm({
  draft,
  errors,
  onChange,
  onBlurField,
  priceDisabled,
  priceRequired,
}: {
  draft: ListingDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<ListingDraft>) => void;
  onBlurField: (field: keyof ListingDraft) => void;
  priceDisabled: boolean;
  priceRequired: boolean;
}) {
  const children = draft.parentCategoryId ? childCategories(draft.parentCategoryId) : [];
  const sizes = sizeOptions(draft.categoryId ?? draft.parentCategoryId);
  const sizeNeeded = requiresSize(draft.categoryId ?? draft.parentCategoryId);

  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      {/* Title */}
      <Field label="Title" htmlFor="listing-title" error={errors.title} help="5 to 80 characters. Say what it is and the brand.">
        <input
          id="listing-title"
          className="input"
          maxLength={80}
          value={draft.title}
          aria-invalid={Boolean(errors.title)}
          onChange={(event) => onChange({ title: event.target.value })}
          onBlur={() => onBlurField("title")}
        />
      </Field>

      {/* Category — cascading */}
      <div className="tt-field-pair">
        <Field label="Category" htmlFor="listing-category" error={errors.parentCategoryId}>
          <select
            id="listing-category"
            className="select"
            value={draft.parentCategoryId ?? ""}
            aria-invalid={Boolean(errors.parentCategoryId)}
            onChange={(event) => {
              const parentId = event.target.value ? Number(event.target.value) : null;
              // Changing the parent invalidates the child and any size choice.
              onChange({ parentCategoryId: parentId, categoryId: null, size: "" });
            }}
            onBlur={() => onBlurField("parentCategoryId")}
          >
            <option value="">Choose a category</option>
            {TOP_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subcategory" htmlFor="listing-subcategory" error={errors.categoryId}>
          <select
            id="listing-subcategory"
            className="select"
            value={draft.categoryId ?? ""}
            disabled={children.length === 0}
            aria-invalid={Boolean(errors.categoryId)}
            onChange={(event) => onChange({ categoryId: event.target.value ? Number(event.target.value) : null })}
            onBlur={() => onBlurField("categoryId")}
          >
            <option value="">{children.length === 0 ? "Choose a category first" : "Choose a subcategory"}</option>
            {children.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Condition — four selectable cards */}
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="field-label" style={{ padding: 0 }}>Condition</legend>
        <div className="tt-condition-grid">
          {CONDITIONS.map((option) => (
            <label
              key={option.value}
              className={`tt-condition-card${draft.condition === option.value ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="condition"
                className="sr-only"
                checked={draft.condition === option.value}
                onChange={() => onChange({ condition: option.value })}
              />
              <span className="t-body-md">{option.label}</span>
              <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="tt-field-pair">
        {/* Size — conditional on category */}
        <Field
          label={sizeNeeded ? "Size" : "Size (not needed for this category)"}
          htmlFor="listing-size"
          error={errors.size}
        >
          <select
            id="listing-size"
            className="select"
            value={draft.size}
            disabled={!sizeNeeded}
            aria-invalid={Boolean(errors.size)}
            onChange={(event) => onChange({ size: event.target.value })}
            onBlur={() => onBlurField("size")}
          >
            <option value="">{sizeNeeded ? "Choose a size" : "Not applicable"}</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Colour (optional)" htmlFor="listing-colour">
          <select
            id="listing-colour"
            className="select"
            value={draft.colour}
            onChange={(event) => onChange({ colour: event.target.value })}
          >
            <option value="">Choose a colour</option>
            {COLOURS.map((colour) => (
              <option key={colour} value={colour}>
                {colour}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Brand (optional)" htmlFor="listing-brand" help="Up to 40 characters.">
        <input
          id="listing-brand"
          className="input"
          maxLength={40}
          list="tt-brand-suggestions"
          value={draft.brand}
          onChange={(event) => onChange({ brand: event.target.value })}
        />
        <datalist id="tt-brand-suggestions">
          {["Nike", "Adidas", "Uniqlo", "Zara", "Apple", "Sony", "Nintendo", "Razer", "Logitech", "Casio", "Vans", "Champion", "The North Face", "Muji", "Decathlon"].map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
      </Field>

      {/* Description */}
      <Field
        label="Description"
        htmlFor="listing-description"
        error={errors.description}
        help="Be honest about wear and marks. Buyers trust listings that mention the flaws."
      >
        <textarea
          id="listing-description"
          className="textarea"
          maxLength={MAX_DESCRIPTION}
          value={draft.description}
          aria-invalid={Boolean(errors.description)}
          aria-describedby="listing-description-count"
          onChange={(event) => onChange({ description: event.target.value })}
          onBlur={() => onBlurField("description")}
        />
        <p
          id="listing-description-count"
          className="t-caption"
          style={{
            marginTop: 6,
            color: draft.description.length < MIN_DESCRIPTION ? "var(--ink-muted)" : "var(--ink-secondary)",
            textAlign: "right",
          }}
        >
          {draft.description.length} / {MAX_DESCRIPTION}
        </p>
      </Field>

      <div className="tt-field-pair">
        {/* Price — required when Sell is chosen, disabled for a giveaway (8.6) */}
        <Field
          label={priceDisabled ? "Price (not used for giveaways)" : priceRequired ? "Price" : "Price (optional)"}
          htmlFor="listing-price"
          error={errors.price}
        >
          <div style={{ position: "relative" }}>
            <span
              className="t-body"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: priceDisabled ? "var(--ink-disabled)" : "var(--ink-muted)",
              }}
            >
              SGD
            </span>
            <input
              id="listing-price"
              className="input"
              type="number"
              min={1}
              max={5000}
              step={1}
              inputMode="decimal"
              style={{ paddingLeft: 48 }}
              value={priceDisabled ? "" : draft.price}
              disabled={priceDisabled}
              aria-invalid={Boolean(errors.price)}
              onChange={(event) => onChange({ price: event.target.value })}
              onBlur={() => onBlurField("price")}
            />
          </div>
        </Field>

        <Field label="Location" htmlFor="listing-region" help="We show a region only, never your address.">
          <select
            id="listing-region"
            className="select"
            value={draft.region}
            onChange={(event) => onChange({ region: event.target.value as Region })}
          >
            {REGIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Accept offers toggle */}
      <label className="tt-toggle-row">
        <span>
          <span className="t-body-md" style={{ display: "block" }}>Accept offers</span>
          <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
            Buyers can suggest a different price. Turn this off if your price is firm.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={draft.acceptsOffers}
          disabled={priceDisabled}
          onChange={(event) => onChange({ acceptsOffers: event.target.checked })}
        />
      </label>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {help ? <p className="field-help">{help}</p> : null}
      {children}
      {/* 15.6 — inline validation is announced, not only shown. */}
      {error ? (
        <p className="field-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
