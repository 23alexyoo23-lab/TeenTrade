"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import type { ListingWithRelations } from "@/lib/types";

/**
 * 8.3 own-listing state: buyer actions are replaced with Edit listing and
 * Mark as sold.
 */
export function OwnerActions({ listing }: { listing: ListingWithRelations }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<"sold" | "delete" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "That did not work.");

      toast(successMessage);
      setConfirming(null);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "That did not work. Try again.", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/listings/${listing.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("We could not delete that listing.");

      toast("Listing deleted.");
      router.push("/sell");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "That did not work. Try again.", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p
        className="t-caption"
        style={{
          margin: "0 0 var(--space-4)",
          padding: "var(--space-2) var(--space-3)",
          background: "var(--surface-subtle)",
          borderRadius: "var(--radius-md)",
          color: "var(--ink-secondary)",
        }}
      >
        This is your listing. Only you can see these actions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Link href={`/sell/${listing.id}/edit`} className="btn btn-tertiary btn-block">
          <Icon name="edit" size={16} />
          Edit listing
        </Link>

        {listing.status !== "sold" ? (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setConfirming("sold")}>
            Mark as sold
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-tertiary btn-block"
            onClick={() => patch({ status: "active" }, "Listing is live again.")}
            disabled={submitting}
          >
            Relist this item
          </button>
        )}

        <button
          type="button"
          className="btn btn-destructive btn-block"
          onClick={() => setConfirming("delete")}
        >
          <Icon name="trash" size={16} />
          Delete listing
        </button>
      </div>

      <Modal
        open={confirming === "sold"}
        onClose={() => setConfirming(null)}
        title="Mark this item as sold?"
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => patch({ status: "sold" }, "Marked as sold.")}
              disabled={submitting}
            >
              {submitting ? <span className="btn-spinner" /> : "Mark as sold"}
            </button>
          </>
        }
      >
        <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>
          It stays on your profile with a SOLD badge, and nobody can buy, offer or trade for it. You can
          relist it later if the handover falls through.
        </p>
      </Modal>

      <Modal
        open={confirming === "delete"}
        onClose={() => setConfirming(null)}
        title="Delete this listing?"
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-destructive" onClick={remove} disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : "Delete listing"}
            </button>
          </>
        }
      >
        <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>
          This removes the listing from TeenTrade. We keep a copy for 30 days in case it is needed for a
          moderation review, then it is deleted for good.
        </p>
      </Modal>
    </>
  );
}
