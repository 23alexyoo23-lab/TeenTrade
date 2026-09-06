"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { SaveButton } from "./SaveButton";
import type { ListingImage } from "@/lib/types";

/**
 * 8.3 Image gallery. Thumbnail strip swaps the main image with a crossfade,
 * and clicking the main image opens a lightbox with keyboard navigation.
 */
export function Gallery({
  images,
  title,
  listingId,
  initialSaved,
  sold,
}: {
  images: ListingImage[];
  title: string;
  listingId: string;
  initialSaved: boolean;
  sold: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const count = images.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(1, count)), [count]);
  const previous = useCallback(() => setIndex((i) => (i - 1 + Math.max(1, count)) % Math.max(1, count)), [count]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    }

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [lightboxOpen, next, previous]);

  const active = images[index];

  return (
    <div className="tt-gallery">
      {/* Thumbnail strip */}
      {count > 1 ? (
        <div className="tt-thumbs" role="group" aria-label="Listing photos">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index}
              className={`tt-thumb${i === index ? " is-active" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.thumbnail_url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Main image */}
      <div className="tt-main-image">
        <button
          type="button"
          onClick={() => count > 0 && setLightboxOpen(true)}
          aria-label={`Open ${title} in full screen`}
          style={{
            display: "block",
            width: "100%",
            aspectRatio: "1 / 1",
            background: "var(--surface-subtle)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            padding: 0,
            cursor: count > 0 ? "zoom-in" : "default",
          }}
        >
          {active ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={active.id}
              src={active.url}
              alt={title}
              className="tt-crossfade"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </button>

        {sold ? (
          <div className="tt-sold-overlay">
            <span className="badge" style={{ background: "var(--ink)", color: "#fff", height: 32, fontSize: 15 }}>
              SOLD
            </span>
          </div>
        ) : (
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <SaveButton listingId={listingId} initialSaved={initialSaved} size={40} />
          </div>
        )}
      </div>

      {lightboxOpen && active ? (
        <div
          className="tt-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, photo ${index + 1} of ${count}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="tt-lightbox-close"
            aria-label="Close full screen view"
            onClick={() => setLightboxOpen(false)}
          >
            <Icon name="x" size={22} />
          </button>

          {count > 1 ? (
            <button
              type="button"
              className="tt-lightbox-nav"
              style={{ left: 16 }}
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
            >
              <Icon name="chevron-left" size={24} />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={title}
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "min(90vw, 900px)", maxHeight: "85vh", objectFit: "contain", borderRadius: "var(--radius-lg)" }}
          />

          {count > 1 ? (
            <button
              type="button"
              className="tt-lightbox-nav"
              style={{ right: 16 }}
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
            >
              <Icon name="chevron-right" size={24} />
            </button>
          ) : null}

          {count > 1 ? (
            <p className="t-caption tt-lightbox-count">
              {index + 1} of {count}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
