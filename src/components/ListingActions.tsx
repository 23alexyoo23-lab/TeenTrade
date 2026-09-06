"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { MeetupPicker } from "./MeetupPicker";
import { Modal } from "./Modal";
import { PaymentNotice } from "./PaymentNotice";
import { ReportModal } from "./ReportModal";
import { useToast } from "./Toast";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { ListingWithRelations, Region, TransactionType } from "@/lib/types";

interface TradeCandidate {
  id: string;
  title: string;
  price_cents: number | null;
  transaction_types: TransactionType[];
  cover_image_url: string | null;
}

/**
 * 8.3 action stack, plus the modals behind it:
 * Buy Now (9.4), Make Offer, and Offer a Trade (9.5).
 */
export function ListingActions({
  listing,
  viewerRegion,
  tradeCandidates,
  canTransact,
}: {
  listing: ListingWithRelations;
  viewerRegion: Region;
  tradeCandidates: TradeCandidate[];
  canTransact: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [openModal, setOpenModal] = useState<"buy" | "offer" | "trade" | "report" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared meetup fields.
  const [locationId, setLocationId] = useState<number | null>(null);
  const [proposedAt, setProposedAt] = useState("");
  const [message, setMessage] = useState("");

  // Make Offer.
  const [offerPrice, setOfferPrice] = useState("");

  // Offer a Trade.
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [cashTopup, setCashTopup] = useState("");

  const isSold = listing.status === "sold";
  const isReserved = listing.status === "reserved";
  const sellable = listing.transaction_types.includes("sell");
  const tradable = listing.transaction_types.includes("trade");
  const giveaway = listing.transaction_types.includes("giveaway");
  const regions: Region[] = Array.from(new Set([viewerRegion, listing.region]));

  function close() {
    setOpenModal(null);
    setError(null);
  }

  function guard(): boolean {
    if (canTransact) return true;
    toast("Your parent or guardian needs to confirm your account before you can do this.", { tone: "error" });
    return false;
  }

  async function send(offerType: "purchase" | "price_offer" | "trade") {
    setError(null);

    if (offerType === "purchase" && !locationId) {
      setError("Choose a verified meetup location.");
      return;
    }
    if (offerType === "price_offer") {
      const amount = Number(offerPrice);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Enter how much you would like to offer.");
        return;
      }
    }
    if (offerType === "trade" && selectedItems.length === 0) {
      setError("Choose at least one of your items to offer.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/listings/${listing.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_type: offerType,
          offered_price_cents: offerType === "price_offer" ? Math.round(Number(offerPrice) * 100) : null,
          offered_listing_ids: offerType === "trade" ? selectedItems : null,
          cash_topup_cents: offerType === "trade" && cashTopup ? Math.round(Number(cashTopup) * 100) : null,
          message: message.trim() || null,
          meetup_location_id: locationId,
          proposed_meetup_at: proposedAt ? new Date(proposedAt).toISOString() : null,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? "We could not send that. Try again shortly.");
        return;
      }

      track("offer_sent", { offer_type: offerType, listing_id: listing.id });
      toast(
        offerType === "purchase"
          ? "Purchase request sent. The seller has 48 hours to respond."
          : offerType === "trade"
            ? "Trade offer sent. You will see the reply in Trade."
            : "Offer sent. You will see the reply in Trade.",
      );
      close();
      router.refresh();
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Link href={`/profile/${listing.seller.username}`} className="btn btn-tertiary btn-block">
          View profile
        </Link>

        {/* 15.3 — Buy Now is hidden when the listing does not include sell. */}
        {(sellable || giveaway) && !isSold ? (
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            disabled={isReserved}
            onClick={() => guard() && setOpenModal("buy")}
          >
            {giveaway ? "Request this item" : "Buy Now"}
          </button>
        ) : null}

        {/* Hidden when the seller turned offers off. */}
        {sellable && listing.accepts_offers && !isSold && !giveaway ? (
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={isReserved}
            onClick={() => guard() && setOpenModal("offer")}
          >
            Make Offer
          </button>
        ) : null}

        {/* Hidden when the listing does not include trade. */}
        {tradable && !isSold ? (
          <button
            type="button"
            className="btn btn-tertiary btn-block"
            disabled={isReserved}
            onClick={() => guard() && setOpenModal("trade")}
          >
            <Icon name="swap" size={16} />
            Offer a Trade
          </button>
        ) : null}

        {isSold ? (
          <p className="t-caption" style={{ margin: 0, color: "var(--ink-muted)", textAlign: "center" }}>
            This item has been sold.
          </p>
        ) : null}
      </div>

      {/* Utility row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 4,
          marginTop: "var(--space-4)",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <ShareButton title={listing.title} />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpenModal("report")}
          style={{ color: "var(--ink-muted)" }}
        >
          <Icon name="flag" size={14} />
          Report
        </button>
      </div>

      {/* 9.4 Purchase intent modal */}
      <Modal
        open={openModal === "buy"}
        onClose={close}
        title={giveaway ? "Request this item" : "Send a purchase request"}
        width={520}
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => send("purchase")}
              disabled={submitting}
            >
              {submitting ? <span className="btn-spinner" /> : "Send purchase request"}
            </button>
          </>
        }
      >
        <ItemSummary listing={listing} />
        <FormError error={error} />

        <MeetupPicker
          value={locationId}
          onChange={setLocationId}
          regions={regions}
          proposedAt={proposedAt}
          onProposedAtChange={setProposedAt}
        />

        <div style={{ marginBottom: "var(--space-4)" }}>
          <label className="field-label" htmlFor="buy-message">
            Message (optional)
          </label>
          <textarea
            id="buy-message"
            className="textarea"
            style={{ minHeight: 72 }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            placeholder="Say hello and confirm when you can meet."
          />
        </div>

        <PaymentNotice />

        <p className="t-caption" style={{ marginTop: "var(--space-3)", color: "var(--ink-muted)" }}>
          Sending this holds the item for you for 48 hours while the seller decides.
        </p>
      </Modal>

      {/* Make Offer modal */}
      <Modal
        open={openModal === "offer"}
        onClose={close}
        title="Make an offer"
        width={480}
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => send("price_offer")}
              disabled={submitting}
            >
              {submitting ? <span className="btn-spinner" /> : "Send offer"}
            </button>
          </>
        }
      >
        <ItemSummary listing={listing} />
        <FormError error={error} />

        <div style={{ marginBottom: "var(--space-4)" }}>
          <label className="field-label" htmlFor="offer-price">
            Your offer
          </label>
          <p className="field-help">
            Asking price is {formatPrice(listing.price_cents, listing.transaction_types)}. Lowballing usually gets ignored.
          </p>
          <div style={{ position: "relative" }}>
            <span
              className="t-body"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-muted)",
              }}
            >
              SGD
            </span>
            <input
              id="offer-price"
              className="input"
              type="number"
              min={1}
              step={1}
              inputMode="decimal"
              style={{ paddingLeft: 48 }}
              value={offerPrice}
              onChange={(event) => setOfferPrice(event.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: "var(--space-4)" }}>
          <label className="field-label" htmlFor="offer-message">
            Message (optional)
          </label>
          <textarea
            id="offer-message"
            className="textarea"
            style={{ minHeight: 72 }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
          />
        </div>

        <PaymentNotice />
      </Modal>

      {/* 9.5 Trade offer modal */}
      <Modal
        open={openModal === "trade"}
        onClose={close}
        title="Offer a trade"
        width={720}
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => send("trade")}
              disabled={submitting || tradeCandidates.length === 0}
            >
              {submitting ? <span className="btn-spinner" /> : "Send trade offer"}
            </button>
          </>
        }
      >
        <FormError error={error} />

        <div className="tt-trade-columns">
          <section>
            <h3 className="t-h3" style={{ marginTop: 0 }}>You are asking for</h3>
            <div className="card" style={{ padding: "var(--space-3)", display: "flex", gap: "var(--space-3)" }}>
              <Thumb src={listing.cover_image_url} alt={listing.title} />
              <div style={{ minWidth: 0 }}>
                <p className="t-body-md line-clamp-2" style={{ margin: 0 }}>{listing.title}</p>
                <p className="t-body" style={{ margin: "4px 0 0", color: "var(--ink-muted)" }}>
                  {formatPrice(listing.price_cents, listing.transaction_types)} · @{listing.seller.username}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="t-h3" style={{ marginTop: 0 }}>What are you offering?</h3>

            {/* 9.5 constraint: you need at least one active listing to trade. */}
            {tradeCandidates.length === 0 ? (
              <div
                style={{
                  padding: "var(--space-5)",
                  border: "1px dashed var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                }}
              >
                <p className="t-body-md" style={{ margin: 0 }}>You have nothing listed yet</p>
                <p className="t-body" style={{ margin: "4px 0 var(--space-4)", color: "var(--ink-muted)" }}>
                  Trades are item for item, so you need at least one active listing first.
                </p>
                <Link href="/sell/new" className="btn btn-primary btn-sm">
                  List an item first
                </Link>
              </div>
            ) : (
              <>
                <p className="field-help">Pick up to 3 of your active listings.</p>
                <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                  {tradeCandidates.map((candidate) => {
                    const checked = selectedItems.includes(candidate.id);
                    const atLimit = selectedItems.length >= 3 && !checked;
                    return (
                      <label
                        key={candidate.id}
                        className={`tt-trade-option${checked ? " is-selected" : ""}`}
                        style={{ opacity: atLimit ? 0.5 : 1, cursor: atLimit ? "not-allowed" : "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={atLimit}
                          onChange={() =>
                            setSelectedItems((current) =>
                              checked ? current.filter((id) => id !== candidate.id) : [...current, candidate.id],
                            )
                          }
                        />
                        <Thumb src={candidate.cover_image_url} alt={candidate.title} size={44} />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span className="t-body-md line-clamp-1" style={{ display: "block" }}>
                            {candidate.title}
                          </span>
                          <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
                            {formatPrice(candidate.price_cents, candidate.transaction_types)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ marginTop: "var(--space-4)" }}>
                  <label className="field-label" htmlFor="trade-topup">
                    Add cash to balance the trade (optional)
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      className="t-body"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      SGD
                    </span>
                    <input
                      id="trade-topup"
                      className="input"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="decimal"
                      style={{ paddingLeft: 48 }}
                      value={cashTopup}
                      onChange={(event) => setCashTopup(event.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {tradeCandidates.length > 0 ? (
          <div style={{ marginTop: "var(--space-5)" }}>
            <label className="field-label" htmlFor="trade-message">
              Message (optional)
            </label>
            <textarea
              id="trade-message"
              className="textarea"
              style={{ minHeight: 72 }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              placeholder="Explain why this is a fair swap."
            />
          </div>
        ) : null}
      </Modal>

      <ReportModal
        open={openModal === "report"}
        onClose={close}
        targetType="listing"
        targetId={listing.id}
        targetLabel={listing.title}
      />
    </>
  );
}

function ItemSummary({ listing }: { listing: ListingWithRelations }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-3)",
        padding: "var(--space-3)",
        background: "var(--surface-subtle)",
        borderRadius: "var(--radius-md)",
        marginBottom: "var(--space-4)",
      }}
    >
      <Thumb src={listing.cover_image_url} alt={listing.title} />
      <div style={{ minWidth: 0 }}>
        <p className="t-body-md line-clamp-2" style={{ margin: 0 }}>{listing.title}</p>
        <p className="t-body" style={{ margin: "4px 0 0", color: "var(--ink-secondary)" }}>
          {formatPrice(listing.price_cents, listing.transaction_types)} · @{listing.seller.username}
        </p>
      </div>
    </div>
  );
}

function Thumb({ src, alt, size = 56 }: { src: string | null; alt: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "var(--radius-md)",
        background: "var(--surface-subtle)",
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
    </span>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="t-body"
      style={{
        background: "var(--red-subtle)",
        color: "var(--red)",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        marginBottom: "var(--space-4)",
      }}
    >
      {error}
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const { toast } = useToast();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          toast("Link copied to your clipboard.");
        } catch {
          // A cancelled share sheet is not an error worth surfacing.
        }
      }}
    >
      <Icon name="share" size={14} />
      Share
    </button>
  );
}
