"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { track } from "@/lib/analytics";

/**
 * 7.2 — the heart toggles optimistically and reverts if the request fails
 * (acceptance criterion 15.1).
 */
export function SaveButton({
  listingId,
  initialSaved,
  size = 32,
  category,
  onRequireAuth,
}: {
  listingId: string;
  initialSaved: boolean;
  size?: number;
  category?: string;
  onRequireAuth?: () => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const next = !saved;
    setSaved(next); // optimistic

    try {
      const response = await fetch(`/api/v1/listings/${listingId}/save`, {
        method: next ? "POST" : "DELETE",
      });

      if (response.status === 401) {
        setSaved(!next);
        if (onRequireAuth) onRequireAuth();
        else router.push(`/login?next=/listing/${listingId}`);
        return;
      }

      if (!response.ok) throw new Error("save failed");

      if (next) track("listing_saved", { listing_id: listingId, category });
      startTransition(() => router.refresh());
    } catch {
      setSaved(!next); // revert
      toast("We could not save that item. Check your connection and try again.", { tone: "error" });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved items" : "Save this item"}
      title={saved ? "Saved" : "Save"}
      disabled={pending}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        color: saved ? "var(--red)" : "var(--ink-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        transition: "color 150ms ease, transform 150ms ease",
      }}
    >
      <Icon name={saved ? "heart-filled" : "heart"} size={Math.round(size * 0.55)} />
    </button>
  );
}
