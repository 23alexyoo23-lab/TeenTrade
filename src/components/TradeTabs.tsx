import Link from "next/link";

export function TradeTabs({
  active,
  sentCount,
  receivedCount,
}: {
  active: "sent" | "received";
  sentCount: number;
  receivedCount: number;
}) {
  const tabs = [
    { id: "received", label: "Received", href: "/trade/received", count: receivedCount },
    { id: "sent", label: "Sent", href: "/trade/sent", count: sentCount },
  ];

  return (
    <div role="tablist" aria-label="Trade offers" style={{ display: "flex", gap: 8, marginBlock: "var(--space-5) var(--space-6)" }}>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={tab.id === active}
          className={`tt-tab${tab.id === active ? " is-active" : ""}`}
        >
          {tab.label}
          {tab.count > 0 ? ` (${tab.count})` : ""}
        </Link>
      ))}
    </div>
  );
}
