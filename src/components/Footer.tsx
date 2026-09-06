import Link from "next/link";
import { PAYMENT_DISCLAIMER } from "@/lib/constants";

export function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", marginTop: "var(--space-12)" }}>
      <div className="tt-container" style={{ paddingBlock: "var(--space-8)" }}>
        <div
          style={{
            display: "grid",
            gap: "var(--space-6)",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div>
            <p className="t-body-md" style={{ margin: 0 }}>TeenTrade</p>
            <p className="t-caption" style={{ margin: "6px 0 0", color: "var(--ink-muted)", maxWidth: 260 }}>
              A teen-only marketplace for Singapore. Buy, sell, trade or give away the things you have
              outgrown.
            </p>
          </div>

          <nav aria-label="Marketplace">
            <p className="t-label" style={{ margin: "0 0 8px", color: "var(--ink-muted)" }}>MARKETPLACE</p>
            <FooterLink href="/buy">Browse items</FooterLink>
            <FooterLink href="/trade">Trade</FooterLink>
            <FooterLink href="/sell/new">List an item</FooterLink>
            <FooterLink href="/account/saved">Saved items</FooterLink>
          </nav>

          <nav aria-label="Safety">
            <p className="t-label" style={{ margin: "0 0 8px", color: "var(--ink-muted)" }}>SAFETY</p>
            <FooterLink href="/safety">Safety hub</FooterLink>
            <FooterLink href="/safety#meetup-locations">Verified meetup locations</FooterLink>
            <FooterLink href="/safety/prohibited-items">Prohibited items</FooterLink>
            <FooterLink href="/safety#contact-moderation">Contact moderation</FooterLink>
          </nav>

          <nav aria-label="Legal">
            <p className="t-label" style={{ margin: "0 0 8px", color: "var(--ink-muted)" }}>LEGAL</p>
            <FooterLink href="/terms">Terms of service</FooterLink>
            <FooterLink href="/privacy">Privacy and PDPA</FooterLink>
          </nav>
        </div>

        <p
          className="t-caption"
          style={{
            margin: "var(--space-8) 0 0",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border)",
            color: "var(--ink-muted)",
          }}
        >
          {PAYMENT_DISCLAIMER} TeenTrade is for users aged 13 to 19 in Singapore.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="t-body"
      style={{ display: "block", color: "var(--ink-secondary)", textDecoration: "none", padding: "3px 0" }}
    >
      {children}
    </Link>
  );
}
