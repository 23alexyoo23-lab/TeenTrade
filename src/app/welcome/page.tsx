import Link from "next/link";
import { HeroArt } from "@/components/HeroArt";
import { Icon } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { redirectIfSignedIn } from "@/lib/auth";
import { searchListings } from "@/lib/data";
import { MAX_AGE, MIN_AGE, PAYMENT_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Buy. Sell. Trade. Made for teens." };

/** Signed-out landing page. Home itself is authenticated (8.1). */
export default async function WelcomePage() {
  await redirectIfSignedIn();

  const { data: newest } = await searchListings({ sort: "newest", perPage: 4 }, null);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      <section className="tt-hero">
        <div className="tt-hero-text">
          <h1 className="t-display" style={{ margin: 0 }}>
            <span style={{ display: "block" }}>Buy. Sell. Trade.</span>
            <span style={{ display: "block", color: "var(--brand-yellow-text)" }}>Made for teens.</span>
          </h1>
          <p
            className="t-body-lg"
            style={{ color: "var(--ink-secondary)", maxWidth: 400, margin: "var(--space-4) 0 var(--space-6)" }}
          >
            The safe and easy way for teens in Singapore to buy, sell or trade second-hand items.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn btn-primary">
              Create your account
            </Link>
            <Link href="/login" className="btn btn-tertiary">
              Log in
            </Link>
          </div>
          <p className="t-caption" style={{ color: "var(--ink-muted)", marginTop: "var(--space-4)" }}>
            For ages {MIN_AGE} to {MAX_AGE} in Singapore. Every account is age verified at signup.
          </p>
        </div>

        <div className="tt-hero-art" aria-hidden="true">
          <HeroArt />
        </div>
      </section>

      <section style={{ marginTop: "var(--space-10)" }}>
        <h2 className="t-h2" style={{ marginTop: 0 }}>Why TeenTrade is different</h2>
        <div
          style={{
            display: "grid",
            gap: "var(--space-4)",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <Differentiator
            icon="shield"
            title="Teen-only membership"
            body={`Every account is age verified at signup. No adult accounts, ever.`}
          />
          <Differentiator
            icon="swap"
            title="Trading comes first"
            body="Trade sits next to Buy everywhere: in navigation, filters, cards, and the listing flow."
          />
          <Differentiator
            icon="map-pin"
            title="Verified meetup locations"
            body="Handovers happen at staffed, public places: MRT controls, libraries, community centres and mall counters."
          />
          <Differentiator
            icon="gift"
            title="Giveaways welcome"
            body="Free listings keep things circulating instead of sitting in a cupboard."
          />
        </div>
      </section>

      {newest.length > 0 ? (
        <section style={{ marginTop: "var(--space-10)" }}>
          <h2 className="t-h2" style={{ marginTop: 0 }}>Just listed</h2>
          <div className="grid-listings">
            {newest.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showSave={false} href="/signup" />
            ))}
          </div>
          <p className="t-caption" style={{ color: "var(--ink-muted)", marginTop: "var(--space-4)" }}>
            Create an account to see full listings, message sellers, and make offers.
          </p>
        </section>
      ) : null}

      <p
        className="t-caption"
        style={{
          marginTop: "var(--space-10)",
          padding: "var(--space-4)",
          background: "var(--blue-subtle)",
          borderRadius: "var(--radius-md)",
          color: "var(--ink-secondary)",
        }}
      >
        {PAYMENT_DISCLAIMER}
      </p>
    </div>
  );
}

function Differentiator({
  icon,
  title,
  body,
}: {
  icon: "shield" | "swap" | "map-pin" | "gift";
  title: string;
  body: string;
}) {
  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <span
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: "var(--brand-yellow-subtle)",
          color: "var(--amber)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-3)",
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <h3 className="t-h3" style={{ margin: "0 0 4px" }}>{title}</h3>
      <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>{body}</p>
    </div>
  );
}
