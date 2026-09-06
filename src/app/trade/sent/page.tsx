import { redirect } from "next/navigation";
import { OfferCard } from "@/components/OfferCard";
import { EmptyState } from "@/components/ui";
import { TradeTabs } from "@/components/TradeTabs";
import { currentUser } from "@/lib/auth";
import { offersReceivedBy, offersSentBy } from "@/lib/data";
import { hydrateOffer } from "@/lib/offers";

export const metadata = { title: "Offers sent" };

/** 5.1 Trade > My trade offers (sent). */
export default async function SentOffersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/trade/sent");

  const [sent, received] = await Promise.all([offersSentBy(user.id), offersReceivedBy(user.id)]);

  const offers = await Promise.all(sent.map((offer) => hydrateOffer(offer, user.id)));
  const sentCount = offers.filter((o) => o.status === "pending").length;
  const receivedCount = received.filter((o) => o.status === "pending").length;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 880 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Offers sent</h1>
      <TradeTabs active="sent" sentCount={sentCount} receivedCount={receivedCount} />

      {offers.length === 0 ? (
        <EmptyState
          icon="swap"
          headline="No trade offers yet"
          body="Browse trade-enabled listings and make an offer."
          action={{ label: "Browse trades", href: "/buy?type=trade" }}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-4)" }}>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} direction="sent" viewerId={user.id} />
          ))}
        </ul>
      )}
    </div>
  );
}
