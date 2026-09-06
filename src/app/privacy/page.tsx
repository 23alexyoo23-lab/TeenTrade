import Link from "next/link";

export const metadata = { title: "Privacy and PDPA" };

/** 10.5, 10.6 — what is collected, what is shown, and retention. */
export default function PrivacyPage() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 760 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Privacy and PDPA</h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
        TeenTrade follows Singapore&apos;s Personal Data Protection Act. Because our users are teenagers, we
        collect as little as we can and show even less.
      </p>

      <Section title="What other users can see">
        <ul>
          <li>Your username</li>
          <li>Your region, such as &quot;East&quot;. Never an address or a precise location</li>
          <li>Your rating, review history and listings</li>
          <li>Roughly when you were last active</li>
        </ul>
        <p>
          Your real name, email, date of birth and mobile number are never shown to another user. Neither is
          your school.
        </p>
      </Section>

      <Section title="What we collect and why">
        <ul>
          <li><strong>Email and password</strong> to sign you in</li>
          <li><strong>Date of birth</strong> to check you are 13 to 19 and whether parental consent is needed</li>
          <li><strong>Mobile number</strong> to verify you are a real person. Encrypted at rest, never shown</li>
          <li><strong>Parent or guardian email</strong> for under 16s, to request consent. Encrypted at rest</li>
          <li><strong>Listings, messages, offers and reviews</strong> to run the marketplace</li>
          <li><strong>What you view and search</strong> to recommend items and improve the product</li>
        </ul>
      </Section>

      <Section title="How long we keep things">
        <ul>
          <li>Chat messages: 12 months, then deleted</li>
          <li>Messages in a thread linked to an open report: until the report is resolved, plus 90 days</li>
          <li>Deleted listings: 30 days in soft-delete for moderation reference</li>
          <li>Parental consent records for under-16 accounts: the life of the account plus 2 years</li>
        </ul>
      </Section>

      <Section title="Your choices">
        <p>
          You can edit your username and region, block anyone, and request account deletion from{" "}
          <Link href="/account/settings" style={{ color: "var(--blue-link)" }}>
            Settings
          </Link>
          . Deletion completes within 30 days. To ask what we hold about you, or to correct it, use{" "}
          <Link href="/safety#contact-moderation" style={{ color: "var(--blue-link)" }}>
            contact moderation
          </Link>
          .
        </p>
      </Section>

      <Section title="Security">
        <ul>
          <li>All traffic is served over HTTPS</li>
          <li>Passwords are stored as salted hashes, never in the clear</li>
          <li>Mobile numbers and parent emails are encrypted at rest</li>
          <li>Sessions are held in an HttpOnly cookie and expire after 30 days</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "var(--space-8)" }}>
      <h2 className="t-h3">{title}</h2>
      <div className="t-body" style={{ color: "var(--ink-secondary)" }}>{children}</div>
    </section>
  );
}
