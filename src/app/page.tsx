import Link from "next/link";
import { redirect } from "next/navigation";
import { Carousel } from "@/components/Carousel";
import { CategoryTile } from "@/components/CategoryTile";
import { HeroArt } from "@/components/HeroArt";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { ListingCard } from "@/components/ListingCard";
import { SectionHeader } from "@/components/ui";
import { TOP_CATEGORIES } from "@/lib/constants";
import { currentUser } from "@/lib/auth";
import { recentlyViewed, recommendedFor } from "@/lib/data";

/**
 * 8.1 Home. Authenticated landing page: hero, categories rail, recommended
 * items, and recently viewed.
 */
export default async function HomePage() {
  const user = await currentUser();
  // Home is an authenticated surface (8.1). Signed-out visitors get the
  // marketing landing page instead.
  if (!user) redirect("/welcome");

  const recommended = await recommendedFor(user.id, 12);
  const recent = await recentlyViewed(user.id, 12);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)" }}>
      {/* Hero banner */}
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
            <Link href="/buy" className="btn btn-primary">
              Explore items
            </Link>
            <HowItWorksModal />
          </div>
        </div>

        <div className="tt-hero-art" aria-hidden="true">
          <HeroArt />
        </div>
      </section>

      {/* Categories */}
      <section style={{ marginTop: "var(--space-10)" }}>
        <SectionHeader title="Categories" href="/buy" />
        <div className="rail">
          {TOP_CATEGORIES.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Recommended for you */}
      <section style={{ marginTop: "var(--space-10)" }}>
        <SectionHeader title="Recommended for you" href="/buy" />
        {recommended.length > 0 ? (
          <Carousel label="Recommended for you">
            {recommended.map((listing) => (
              <div key={listing.id} className="rail-item">
                <ListingCard listing={listing} />
              </div>
            ))}
          </Carousel>
        ) : (
          <p className="t-body card" style={{ padding: "var(--space-6)", color: "var(--ink-muted)", margin: 0 }}>
            Nothing to recommend yet. Once other teens start listing, their newest items appear here.
          </p>
        )}
      </section>

      {/* Recently viewed — hidden entirely when there is no history (8.1). */}
      {recent.length > 0 ? (
        <section style={{ marginTop: "var(--space-10)" }}>
          <SectionHeader title="Recently viewed" href="/buy" />
          <Carousel label="Recently viewed">
            {recent.map((listing) => (
              <div key={listing.id} className="rail-item">
                <ListingCard listing={listing} />
              </div>
            ))}
          </Carousel>
        </section>
      ) : null}
    </div>
  );
}
