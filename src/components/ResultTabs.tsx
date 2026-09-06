import Link from "next/link";

/** 8.2 — All / Buy Now / Trade tabs with counts from the API facets object. */
export function ResultTabs({
  active,
  facets,
  buildHref,
}: {
  active: string;
  facets: { all: number; buy_now: number; trade: number; giveaway: number };
  buildHref: (type: string) => string;
}) {
  const tabs = [
    { value: "all", label: "All", count: facets.all },
    { value: "sell", label: "Buy Now", count: facets.buy_now },
    { value: "trade", label: "Trade", count: facets.trade },
    { value: "giveaway", label: "Giveaway", count: facets.giveaway },
  ];

  return (
    <div role="tablist" aria-label="Result type" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={buildHref(tab.value)}
            role="tab"
            aria-selected={isActive}
            className={`tt-tab${isActive ? " is-active" : ""}`}
          >
            {tab.label} ({tab.count})
          </Link>
        );
      })}
    </div>
  );
}
