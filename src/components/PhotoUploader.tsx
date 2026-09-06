"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import {
  MAX_PHOTOS,
  MESSAGES,
  type ProcessedImage,
  processImage,
  validateFile,
} from "@/lib/images";

interface PendingUpload {
  id: string;
  name: string;
  failed: boolean;
  file: File;
}

/**
 * 8.4 Create listing, step 1. Drag and drop plus button upload, reorderable
 * thumbnails, cover badge on the first photo, and the validation messages
 * listed in the spec.
 */
export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: ProcessedImage[];
  onChange: (photos: ProcessedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const dragIndex = useRef<number | null>(null);

  const atLimit = photos.length >= MAX_PHOTOS;

  async function addFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(MESSAGES.limitReached);
      return;
    }
    if (list.length > room) {
      setError(MESSAGES.limitReached);
    }

    const accepted: File[] = [];
    for (const file of list.slice(0, room)) {
      const problem = validateFile(file);
      if (problem) {
        setError(problem);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    const queued: PendingUpload[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      failed: false,
      file,
    }));
    setPending((current) => [...current, ...queued]);

    const results: ProcessedImage[] = [];
    for (const item of queued) {
      try {
        const processed = await processImage(item.file);
        results.push({ id: item.id, name: item.name, ...processed });
        setPending((current) => current.filter((p) => p.id !== item.id));
      } catch {
        setPending((current) => current.map((p) => (p.id === item.id ? { ...p, failed: true } : p)));
      }
    }

    if (results.length > 0) onChange([...photos, ...results].slice(0, MAX_PHOTOS));
  }

  async function retry(item: PendingUpload) {
    setPending((current) => current.map((p) => (p.id === item.id ? { ...p, failed: false } : p)));
    try {
      const processed = await processImage(item.file);
      onChange([...photos, { id: item.id, name: item.name, ...processed }].slice(0, MAX_PHOTOS));
      setPending((current) => current.filter((p) => p.id !== item.id));
    } catch {
      setPending((current) => current.map((p) => (p.id === item.id ? { ...p, failed: true } : p)));
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`tt-dropzone${dragActive ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!atLimit) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!atLimit) void addFiles(event.dataTransfer.files);
        }}
      >
        <span aria-hidden="true" style={{ color: "var(--amber)" }}>
          <Icon name="upload-cloud" size={48} strokeWidth={1.6} />
        </span>
        <p className="t-h3" style={{ margin: "var(--space-3) 0 0" }}>
          Drag and drop photos here
        </p>
        <p className="t-caption" style={{ margin: "var(--space-2) 0", color: "var(--ink-muted)" }}>
          or
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
          disabled={atLimit}
        >
          Upload photos
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.heic,.heif"
          multiple
          aria-label="Choose photos to upload"
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <p
          className="t-caption"
          style={{ margin: "var(--space-3) 0 0", color: atLimit ? "var(--red)" : "var(--ink-muted)" }}
        >
          {atLimit ? MESSAGES.limitReached : `You can add up to ${MAX_PHOTOS} photos`}
        </p>
      </div>

      {error ? (
        <p className="field-error" role="alert" aria-live="polite" style={{ marginTop: "var(--space-3)" }}>
          {error}
        </p>
      ) : null}

      {/* Thumbnail strip */}
      {photos.length > 0 || pending.length > 0 ? (
        <div className="tt-photo-strip">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="tt-photo-thumb"
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null) move(dragIndex.current, index);
                dragIndex.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumbnail_url} alt={`Photo ${index + 1}${index === 0 ? ", cover" : ""}`} />

              {index === 0 ? <span className="tt-photo-cover">Cover</span> : null}

              <button
                type="button"
                className="tt-photo-remove"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
              >
                <Icon name="x" size={12} strokeWidth={2.5} />
              </button>

              {/* Keyboard equivalent for drag-to-reorder (13.2). */}
              <div className="tt-photo-reorder">
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <Icon name="chevron-left" size={12} />
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <Icon name="chevron-right" size={12} />
                </button>
              </div>
            </div>
          ))}

          {pending.map((item) => (
            <div key={item.id} className={`tt-photo-thumb${item.failed ? " is-failed" : ""}`}>
              {item.failed ? (
                <div className="tt-photo-retry">
                  <Icon name="alert-triangle" size={18} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => retry(item)}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="skeleton" style={{ width: "100%", height: "100%" }} />
              )}
            </div>
          ))}

          {!atLimit ? (
            <button
              type="button"
              className="tt-photo-add"
              onClick={() => inputRef.current?.click()}
              aria-label="Add another photo"
            >
              <Icon name="plus" size={20} />
            </button>
          ) : null}
        </div>
      ) : null}

      {photos.length > 1 ? (
        <p className="t-caption" style={{ marginTop: "var(--space-3)", color: "var(--ink-muted)" }}>
          Drag to reorder. The first photo is the cover buyers see on cards and in search.
        </p>
      ) : null}
    </div>
  );
}
