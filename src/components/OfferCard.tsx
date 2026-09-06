"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { Avatar, Badge } from "./ui";
import { formatDateTime, formatPrice, relativeTime, timeUntil } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { OfferWithRelations } from "@/lib/offers";

const STATUS_TONE: Record<string, "neutral" | "green" | "red" | "amber" | "trade"> = {
  pending: "amber",
  accepted: "green",
  declined: "red",
  countered: "trade",
  expired: "neutral",
  completed: "green",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting for a reply",
  accepted: "Accepted",
  declined: "Declined",
  countered: "Countered",
  expired: "Expired",
  completed: "Completed",
};

/** Used by Trade > Sent and Trade > Received. */
export function OfferCard({
  offer,
  direction,
  viewerId,
}: {
  offer: OfferWithRelations;
  direction: "sent" | "received";
  viewerId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const counterparty = direction === "sent" ? offer.seller : offer.offerer;
  const canRespond = direction === "received" && offer.status === "pending";
  const canConfirm =
    offer.status === "accepted" && !offer.completed_by.includes(viewerId);
  const awaitingOther =
    offer.status === "accepted" && offer.completed_by.includes(viewerId);

  async function act(action: "accept" | "decline" | "complete") {
    setBusy(action);
    try {
      const response = await fetch(`/api/v1/offers/${offer.id}/${action}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "That did not work.");

      if (action === "accept") {
        track("offer_responded", { offer_type: offer.offer_type, response: "accepted" });
        toast("Offer accepted. The meetup details are pinned in your messages.");
        router.push(`/messages/${body.conversation_id}`);
      } else if (action === "decline") {
        track("offer_responded", { offer_type: offer.offer_type, response: "declined" });
        toast("Offer declined.");
      } else {
        toast(
          body.status === "completed"
            ? "All done. Leave a review to help other teens."
            : "Confirmed. Waiting for the other person to confirm too.",
        );
      }
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "That did not work. Try again.", { tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* The listing being offered on */}
        <Link
          href={offer.listing ? `/listing/${offer.listing.id}` : "#"}
          style={{
            width: 88,
            height: 88,
            borderRadius: "var(--radius-md)",
            background: "var(--surface-subtle)",
            overflow: "hidden",
            flexShrink: 0,
          }}
          aria-label={offer.listing?.title ?? "Listing"}
        >
          {offer.listing?.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.listing.cover_image_url}
              alt={offer.listing.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </Link>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge tone={STATUS_TONE[offer.status] ?? "neutral"}>{STATUS_LABEL[offer.status]}</Badge>
            <Badge tone={offer.offer_type === "trade" ? "trade" : "buy"}>
              {offer.offer_type === "trade" ? "Trade" : offer.offer_type === "purchase" ? "Buy Now" : "Offer"}
            </Badge>
            <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
              {relativeTime(offer.created_at)}
            </span>
          </div>

          <h3 className="t-body-md" style={{ margin: "var(--space-2) 0 0" }}>
            {offer.listing?.title ?? "Listing no longer available"}
          </h3>

          {counterparty ? (
            <p
              className="t-caption"
              style={{ margin: "4px 0 0", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Avatar user={counterparty} size={20} />
              {direction === "sent" ? "To" : "From"}{" "}
              <Link href={`/profile/${counterparty.username}`} style={{ color: "var(--blue-link)" }}>
                @{counterparty.username}
              </Link>
            </p>
          ) : null}

          {/* What is on the table */}
          <div style={{ marginTop: "var(--space-3)" }}>
            {offer.offer_type === "price_offer" ? (
              <p className="t-body" style={{ margin: 0 }}>
                Offered <strong>{formatPrice(offer.offered_price_cents)}</strong>
                {offer.listing?.price_cents ? (
                  <span style={{ color: "var(--ink-muted)" }}>
                    {" "}
                    (asking {formatPrice(offer.listing.price_cents)})
                  </span>
                ) : null}
              </p>
            ) : null}

            {offer.offer_type === "trade" ? (
              <>
                <p className="t-caption" style={{ margin: "0 0 6px", color: "var(--ink-muted)" }}>
                  {direction === "sent" ? "You offered" : "They offered"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {offer.offered_listings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/listing/${item.id}`}
                      className="t-caption"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px 4px 4px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-full)",
                        textDecoration: "none",
                        color: "var(--ink)",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "var(--radius-full)",
                          background: "var(--surface-subtle)",
                          overflow: "hidden",
                        }}
                      >
                        {item.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_image_url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </span>
                      {item.title}
                    </Link>
                  ))}
                  {offer.cash_topup_cents ? (
                    <span className="badge badge-green">+ {formatPrice(offer.cash_topup_cents)} cash</span>
                  ) : null}
                </div>
              </>
            ) : null}

            {offer.meetup_location ? (
              <p
                className="t-caption"
                style={{ margin: "var(--space-3) 0 0", color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="map-pin" size={14} />
                {offer.meetup_location.name}
                {offer.proposed_meetup_at ? ` · ${formatDateTime(offer.proposed_meetup_at)}` : ""}
              </p>
            ) : null}

            {offer.message ? (
              <p
                className="t-body"
                style={{
                  margin: "var(--space-3) 0 0",
                  padding: "var(--space-3)",
                  background: "var(--surface-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink-secondary)",
                }}
              >
                &ldquo;{offer.message}&rdquo;
              </p>
            ) : null}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
            {canRespond ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => act("accept")}
                  disabled={busy !== null}
                >
                  {busy === "accept" ? <span className="btn-spinner" /> : "Accept"}
                </button>
                <button
                  type="button"
                  className="btn btn-tertiary btn-sm"
                  onClick={() => act("decline")}
                  disabled={busy !== null}
                >
                  {busy === "decline" ? <span className="btn-spinner" /> : "Decline"}
                </button>
              </>
            ) : null}

            {canConfirm ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => act("complete")}
                disabled={busy !== null}
              >
                {busy === "complete" ? <span className="btn-spinner" /> : "We met, mark as done"}
              </button>
            ) : null}

            {awaitingOther ? (
              <span className="t-caption" style={{ color: "var(--ink-muted)", alignSelf: "center" }}>
                Waiting for the other person to confirm the handover.
              </span>
            ) : null}

            {offer.status === "pending" && direction === "sent" ? (
              <span className="t-caption" style={{ color: "var(--ink-muted)", alignSelf: "center" }}>
                Expires {timeUntil(offer.expires_at)}
              </span>
            ) : null}

            {offer.status === "accepted" || offer.status === "completed" ? (
              <Link href="/messages" className="btn btn-ghost btn-sm">
                <Icon name="message" size={14} />
                Open chat
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
