import Link from "next/link";
import { redirect } from "next/navigation";
import { Carousel } from "@/components/Carousel";
import { Icon } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState, SectionHeader } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { listingsBySeller, offersReceivedBy, offersSentBy, searchListings } from "@/lib/data";

export const metadata = { title: "Trade" };

/** 5.2 Trade — trade-enabled listings, plus a route into sent and received offers. */
export default async function TradePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/trade");

  const { data: tradable, meta } = await searchListings({ type: "trade", sort: "newest", perPage: 12 }, user.id);
  const myTradables = (await listingsBySeller(user.id, ["active"])).filter((l) =>
    l.transaction_types.includes("trade"),
  );

  const sentPending = (await offersSentBy(user.id)).filter((o) => o.status === "pending").length;
  const receivedPending = (await offersReceivedBy(user.id)).filter((o) => o.status === "pending").length;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Trade</h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)", maxWidth: 620 }}>
        Swap something you have outgrown for something you want. No money needs to change hands, though you
        can add a cash top-up to even things out.
      </p>

      {/* Offer inboxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
        <OfferLink
          href="/trade/received"
          icon="arrow-left"
          title="Offers received"
          count={receivedPending}
          body="Offers other teens have made on your listings."
        />
        <OfferLink
          href="/trade/sent"
          icon="arrow-right"
          title="Offers sent"
          count={sentPending}
          body="Offers you are waiting to hear back on."
        />
      </div>

      {/* Your trade-enabled listings */}
      <section style={{ marginTop: "var(--space-10)" }}>
        <SectionHeader title="Your items open to trades" href="/sell" linkLabel="Manage listings" />
        {myTradables.length === 0 ? (
          <div className="card" style={{ padding: "var(--space-5)", display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--ink-muted)" }}>
              <Icon name="swap" size={20} />
            </span>
            <p className="t-body" style={{ margin: 0, flex: 1, minWidth: 240, color: "var(--ink-secondary)" }}>
              You need at least one active listing before you can send a trade offer. Tick &ldquo;Trade&rdquo; in step 3
              when you list something.
            </p>
            <Link href="/sell/new" className="btn btn-primary btn-sm">
              List an item
            </Link>
          </div>
        ) : (
          <Carousel label="Your trade-enabled listings">
            {myTradables.map((listing) => (
              <div key={listing.id} className="rail-item">
                <ListingCard listing={listing} showSave={false} />
              </div>
            ))}
          </Carousel>
        )}
      </section>

      {/* Everything open to trades */}
      <section style={{ marginTop: "var(--space-10)" }}>
        <SectionHeader
          title={`Open to trades (${meta.facets.trade})`}
          href="/buy?type=trade"
          linkLabel="See all"
        />
        {tradable.length === 0 ? (
          <EmptyState
            icon="swap"
            headline="No trade offers yet"
            body="Browse trade-enabled listings and make an offer."
            action={{ label: "Browse trades", href: "/buy?type=trade" }}
          />
        ) : (
          <div className="grid-listings">
            {tradable.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OfferLink({
  href,
  icon,
  title,
  body,
  count,
}: {
  href: string;
  icon: "arrow-left" | "arrow-right";
  title: string;
  body: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="card"
      style={{ padding: "var(--space-5)", display: "flex", gap: "var(--space-3)", textDecoration: "none", color: "inherit" }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          background: count > 0 ? "var(--brand-yellow-subtle)" : "var(--surface-subtle)",
          color: count > 0 ? "var(--amber)" : "var(--ink-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="t-body-md" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          {count > 0 ? <span className="badge badge-amber">{count} waiting</span> : null}
        </span>
        <span className="t-caption" style={{ color: "var(--ink-muted)" }}>{body}</span>
      </span>
    </Link>
  );
}
