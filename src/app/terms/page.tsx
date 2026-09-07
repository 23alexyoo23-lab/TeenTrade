import Link from "next/link";
import { MAX_AGE, MIN_AGE, PAYMENT_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Terms of service" };

/** 10.4 requires the payment position to be stated in the terms. */
export default function TermsPage() {
  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 760 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Terms of service</h1>
      <p className="t-caption" style={{ color: "var(--ink-muted)" }}>
        Plain English summary. A full legal version would sit alongside this before launch.
      </p>

      <Section title="Who can use TeenTrade">
        <p>
          TeenTrade is for people aged {MIN_AGE} to {MAX_AGE} who are in Singapore. We verify age at
          signup. Adult accounts are not permitted.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          <strong>{PAYMENT_DISCLAIMER}</strong> We do not hold funds, process cards, or act as an escrow.
          Anything you agree about money is between you and the other person. Check the item in person
          before you pay.
        </p>
      </Section>

      <Section title="What you can list">
        <p>
          You must own what you list and describe it honestly, including its faults. Some things cannot be
          listed at all: see the{" "}
          <Link href="/safety/prohibited-items" style={{ color: "var(--blue-link)" }}>
            prohibited items list
          </Link>
          . Listings are screened automatically and may be held for a person to review.
        </p>
      </Section>

      <Section title="How you treat other people">
        <p>
          No harassment, no scams, no pretending to be someone you are not. Keep conversations on TeenTrade
          so that our team can help if something goes wrong. Contact details typed into listings and
          messages are removed automatically.
        </p>
      </Section>

      <Section title="Meeting in person">
        <p>
          Handovers happen in person and at your own risk. We strongly recommend a verified meetup location
          and bringing a friend or family member. TeenTrade does not supervise meetups and is not a party to
          your transaction.
        </p>
      </Section>

      <Section title="Moderation and enforcement">
        <p>
          We can hide, remove or refuse a listing, and we can suspend or close an account, where these terms
          or our community guidelines are broken. Reports are reviewed within 24 hours. We do not tell the
          person reported who reported them.
        </p>
      </Section>

      <Section title="Your data">
        <p>
          We follow Singapore&apos;s Personal Data Protection Act. See the{" "}
          <Link href="/privacy" style={{ color: "var(--blue-link)" }}>
            privacy notice
          </Link>{" "}
          for what we collect, why, and how long we keep it. You can request account deletion at any time
          from Settings.
        </p>
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
