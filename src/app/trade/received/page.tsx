import { redirect } from "next/navigation";
import { OfferCard } from "@/components/OfferCard";
import { EmptyState } from "@/components/ui";
import { TradeTabs } from "@/components/TradeTabs";
import { currentUser } from "@/lib/auth";
import { offersReceivedBy, offersSentBy } from "@/lib/data";
import { hydrateOffer } from "@/lib/offers";

export const metadata = { title: "Offers received" };

/** 5.1 Trade > My trade offers (received). */
export default async function ReceivedOffersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/trade/received");

  const [received, sent] = await Promise.all([offersReceivedBy(user.id), offersSentBy(user.id)]);

  const offers = await Promise.all(received.map((offer) => hydrateOffer(offer, user.id)));
  const sentCount = sent.filter((o) => o.status === "pending").length;
  const receivedCount = offers.filter((o) => o.status === "pending").length;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 880 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Offers received</h1>
      <TradeTabs active="received" sentCount={sentCount} receivedCount={receivedCount} />

      {offers.length === 0 ? (
        <EmptyState
          icon="swap"
          headline="No trade offers yet"
          body="When someone offers to buy or swap for one of your items, it appears here."
          action={{ label: "Browse trades", href: "/buy?type=trade" }}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-4)" }}>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} direction="received" viewerId={user.id} />
          ))}
        </ul>
      )}
    </div>
  );
}
