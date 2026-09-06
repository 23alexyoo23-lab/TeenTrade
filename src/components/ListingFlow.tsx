"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChooseStep } from "./ChooseStep";
import { DetailsForm, type DraftErrors, type ListingDraft } from "./DetailsForm";
import { Icon } from "./Icon";
import { PhotoUploader } from "./PhotoUploader";
import { Banner } from "./ui";
import { useToast } from "./Toast";
import { requiresSize } from "@/lib/constants";
import { MESSAGES, type ProcessedImage } from "@/lib/images";
import { track } from "@/lib/analytics";
import type { Region, TransactionType } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Photos" },
  { id: 2, label: "Details" },
  { id: 3, label: "Choose" },
];

export interface InitialListing {
  id: string;
  draft: ListingDraft;
  photos: ProcessedImage[];
  transactionTypes: TransactionType[];
}

/**
 * 9.3 — the three-step create and edit flow. Steps 1 to 3 are specified in
 * 8.4, 8.5 and 8.6.
 */
export function ListingFlow({
  defaultRegion,
  initial,
  mode,
}: {
  defaultRegion: Region;
  initial?: InitialListing;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<ProcessedImage[]>(initial?.photos ?? []);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
    initial?.transactionTypes ?? ["sell"],
  );
  const [draft, setDraft] = useState<ListingDraft>(
    initial?.draft ?? {
      title: "",
      parentCategoryId: null,
      categoryId: null,
      condition: "good",
      size: "",
      colour: "",
      brand: "",
      description: "",
      price: "",
      region: defaultRegion,
      acceptsOffers: true,
    },
  );

  const [errors, setErrors] = useState<DraftErrors>({});
  const [touched, setTouched] = useState<Set<keyof ListingDraft>>(new Set());
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(null);

  // 8.6 clears the price when Giveaway is chosen. Remember what the seller
  // typed so that changing their mind does not silently lose it.
  const lastPriceRef = useRef(initial?.draft.price ?? "");
  const publishedRef = useRef(false);
  const stepStartedAt = useRef(Date.now());
  const stepRef = useRef(step);
  stepRef.current = step;

  const isGiveaway = transactionTypes.includes("giveaway");
  const priceRequired = transactionTypes.includes("sell");

  useEffect(() => {
    if (mode === "create") track("listing_flow_started", { entry_point: "sell_new" });
  }, [mode]);

  // 14.1 — record where the user dropped out if they leave mid-flow.
  useEffect(() => {
    function onLeave() {
      if (publishedRef.current) return;
      track("listing_flow_abandoned", { last_step_reached: stepRef.current });
    }
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  // 8.6 — selecting Giveaway clears and disables the price from step 2, and
  // deselecting it puts the seller's price back.
  useEffect(() => {
    if (isGiveaway) {
      if (draft.price !== "") {
        lastPriceRef.current = draft.price;
        setDraft((current) => ({ ...current, price: "" }));
      }
      return;
    }
    if (draft.price === "" && lastPriceRef.current !== "") {
      setDraft((current) => ({ ...current, price: lastPriceRef.current }));
    }
  }, [isGiveaway, draft.price]);

  const validateDetails = useCallback(
    (fields?: (keyof ListingDraft)[]): DraftErrors => {
      const next: DraftErrors = {};

      if (draft.title.trim().length < 5 || draft.title.trim().length > 80) {
        next.title = "Titles are between 5 and 80 characters.";
      }
      if (!draft.parentCategoryId) {
        next.parentCategoryId = "Choose a category.";
      }
      if (draft.description.trim().length < 20) {
        next.description = "Write at least 20 characters so buyers know what they are getting.";
      }
      if (requiresSize(draft.categoryId ?? draft.parentCategoryId) && !draft.size) {
        next.size = "Choose a size. Buyers filter by it.";
      }
      if (priceRequired && !isGiveaway) {
        const price = Number(draft.price);
        if (!draft.price || !Number.isFinite(price) || price < 1 || price > 5000) {
          next.price = "Enter a price between $1 and $5000.";
        }
      }

      if (!fields) return next;

      // Only surface the requested fields, so blur validation stays local.
      const filtered: DraftErrors = {};
      for (const field of fields) {
        if (next[field]) filtered[field] = next[field];
      }
      return filtered;
    },
    [draft, isGiveaway, priceRequired],
  );

  function goToStep(target: number) {
    // 14.1 — time on each step feeds the listing creation funnel.
    track("listing_step_completed", {
      step_number: stepRef.current,
      time_on_step_seconds: Math.round((Date.now() - stepStartedAt.current) / 1000),
    });
    stepStartedAt.current = Date.now();
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextFromPhotos() {
    if (photos.length === 0) {
      setPhotoError(MESSAGES.needOne);
      return;
    }
    setPhotoError(null);
    goToStep(2);
  }

  function nextFromDetails() {
    const found = validateDetails();
    setErrors(found);
    setTouched(new Set(Object.keys(found) as (keyof ListingDraft)[]));

    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so keyboard and screen reader users
      // land on it.
      const first = Object.keys(found)[0];
      document.getElementById(`listing-${fieldToInputId(first as keyof ListingDraft)}`)?.focus();
      return;
    }
    goToStep(3);
  }

  function body() {
    const categoryId = draft.categoryId ?? draft.parentCategoryId;
    return {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category_id: categoryId,
      condition: draft.condition,
      size: draft.size || null,
      colour: draft.colour || null,
      brand: draft.brand.trim() || null,
      price_cents: isGiveaway || !draft.price ? null : Math.round(Number(draft.price) * 100),
      transaction_types: transactionTypes,
      accepts_offers: isGiveaway ? false : draft.acceptsOffers,
      region: draft.region,
      images: photos.map((photo) => ({ url: photo.url, thumbnail_url: photo.thumbnail_url })),
    };
  }

  async function save(action: "draft" | "publish") {
    setSubmitError(null);
    setWarnings([]);

    if (action === "publish") {
      if (photos.length === 0) {
        setSubmitError(MESSAGES.needOne);
        setStep(1);
        return;
      }
      const found = validateDetails();
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setSubmitError("Some details still need fixing. We have taken you back to step 2.");
        setStep(2);
        return;
      }
      if (transactionTypes.length === 0) {
        setSubmitError("Choose whether you want to sell, trade or give this item away.");
        return;
      }
    }

    setSubmitting(action);
    try {
      const endpoint =
        mode === "edit" && initial
          ? `/api/v1/listings/${initial.id}/publish`
          : "/api/v1/listings/publish";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), action, listing_id: initial?.id ?? null }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setSubmitError(payload?.error?.message ?? "We could not save that. Try again shortly.");
        return;
      }

      if (Array.isArray(payload.warnings) && payload.warnings.length > 0) {
        setWarnings(payload.warnings);
      }

      if (action === "draft") {
        toast("Draft saved. You will find it in My Listings.");
        router.push("/sell?tab=draft");
        router.refresh();
        return;
      }

      publishedRef.current = true;
      track("listing_published", {
        category: draft.parentCategoryId,
        transaction_types: transactionTypes,
        photo_count: photos.length,
        price_cents: isGiveaway ? null : Math.round(Number(draft.price) * 100),
      });
      track("listing_step_completed", { step_number: 3, time_on_step_seconds: 0 });

      // 8.6 — success toast with a Share action, then the listing detail page.
      const listingUrl = `/listing/${payload.id}`;
      toast("Your listing is live.", {
        action: {
          label: "Share",
          onClick: () => {
            const url = `${window.location.origin}${listingUrl}`;
            if (navigator.share) void navigator.share({ title: draft.title, url });
            else void navigator.clipboard?.writeText(url);
          },
        },
      });

      router.push(payload.status === "pending_review" ? `${listingUrl}?published=pending` : listingUrl);
      router.refresh();
    } catch {
      setSubmitError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="panel">
      {/* Step indicator */}
      <ol className="tt-steps" style={{ marginBottom: "var(--space-8)" }}>
        {STEPS.map((item) => {
          const state = item.id < step ? "is-complete" : item.id === step ? "is-active" : "is-upcoming";
          return (
            <li key={item.id} className={`tt-step${item.id < step ? " is-linked" : ""}`}>
              <span className={`tt-step-circle ${state}`}>
                {item.id < step ? <Icon name="check" size={14} /> : item.id}
              </span>
              <span
                className={`t-caption tt-step-label ${
                  item.id === step ? "is-active" : item.id < step ? "is-complete" : ""
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {submitError ? (
        <div style={{ marginBottom: "var(--space-5)" }} aria-live="polite">
          <Banner tone="error" icon="alert-triangle" title={submitError} />
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div style={{ marginBottom: "var(--space-5)" }} aria-live="polite">
          <Banner tone="amber" icon="shield" title="Before you go">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      {/* Step 1: Photos */}
      {step === 1 ? (
        <>
          <PhotoUploader
            photos={photos}
            onChange={(next) => {
              setPhotos(next);
              if (next.length > 0) setPhotoError(null);
            }}
          />
          {photoError ? (
            <p className="field-error" role="alert" aria-live="polite" style={{ marginTop: "var(--space-3)" }}>
              {photoError}
            </p>
          ) : null}
        </>
      ) : null}

      {/* Step 2: Details */}
      {step === 2 ? (
        <DetailsForm
          draft={draft}
          errors={errors}
          priceDisabled={isGiveaway}
          priceRequired={priceRequired}
          onChange={(patch) => {
            setDraft((current) => ({ ...current, ...patch }));
            // Clear an error as soon as the field is edited.
            setErrors((current) => {
              const next = { ...current };
              for (const key of Object.keys(patch)) delete next[key as keyof ListingDraft];
              return next;
            });
          }}
          onBlurField={(field) => {
            setTouched((current) => new Set(current).add(field));
            setErrors((current) => ({ ...current, ...validateDetails([field]) }));
          }}
        />
      ) : null}

      {/* Step 3: Choose */}
      {step === 3 ? (
        <ChooseStep
          selected={transactionTypes}
          onChange={setTransactionTypes}
          draft={draft}
          photos={photos}
        />
      ) : null}

      {/* Footer actions */}
      <div className="tt-flow-footer">
        {step > 1 ? (
          <button type="button" className="btn btn-tertiary" onClick={() => goToStep(step - 1)}>
            Back
          </button>
        ) : (
          <button type="button" className="btn btn-tertiary" onClick={() => router.push("/sell")}>
            Cancel
          </button>
        )}

        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={() => save("draft")}
              disabled={submitting !== null}
            >
              {submitting === "draft" ? <span className="btn-spinner" /> : "Save Draft"}
            </button>
          ) : null}

          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={step === 1 ? nextFromPhotos : nextFromDetails}
              // 15.4 — Next is disabled until at least one photo is uploaded.
              disabled={step === 1 && photos.length === 0}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => save("publish")}
              disabled={submitting !== null || transactionTypes.length === 0}
            >
              {submitting === "publish" ? (
                <span className="btn-spinner" />
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Publish Listing"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Touched fields are tracked so blur validation can be reasoned about
          during development; nothing is rendered from it directly. */}
      <span className="sr-only">{touched.size > 0 ? `${touched.size} fields checked` : ""}</span>
    </div>
  );
}

function fieldToInputId(field: keyof ListingDraft): string {
  switch (field) {
    case "parentCategoryId":
      return "category";
    case "categoryId":
      return "subcategory";
    default:
      return field;
  }
}
