import { notFound } from "next/navigation";
import { ConsentForm } from "./ConsentForm";
import { Icon } from "@/components/Icon";
import { getUserByConsentToken } from "@/lib/data";
import { PAYMENT_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Confirm your teen's account" };

const CONSENT_WINDOW_DAYS = 7;

/**
 * 9.2 — the public page a parent or guardian opens from the consent email.
 * Explains what TeenTrade is, what their teen can do, and the safety measures,
 * before asking for an explicit confirmation.
 */
export default async function ParentConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUserByConsentToken(token);
  if (!user) notFound();

  const alreadyConsented = user.parent_consent_at !== null;
  const sentAt = user.parent_consent_sent_at ? new Date(user.parent_consent_sent_at).getTime() : 0;
  const expired = !alreadyConsented && Date.now() - sentAt > CONSENT_WINDOW_DAYS * 864e5;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 720 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>
        {alreadyConsented ? "This account is already confirmed" : `Confirm @${user.username}'s account`}
      </h1>

      {alreadyConsented ? (
        <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
          Thank you. Nothing further is needed. You can close this page.
        </p>
      ) : expired ? (
        <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
          This confirmation link has expired. Ask your teen to resend it from the banner at the top of any
          TeenTrade page, and you will receive a fresh email.
        </p>
      ) : (
        <>
          <p className="t-body-lg" style={{ color: "var(--ink-secondary)" }}>
            Your teen has asked to join TeenTrade. Because they are under 16, we need your confirmation
            before their account can be used.
          </p>

          <section className="card" style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}>
            <h2 className="t-h3" style={{ marginTop: 0 }}>What TeenTrade is</h2>
            <p className="t-body" style={{ color: "var(--ink-secondary)" }}>
              A marketplace for teenagers aged 13 to 19 in Singapore to buy, sell, trade or give away
              second-hand items such as clothing, shoes, books and gaming gear. Every account is age
              verified. There are no adult accounts.
            </p>

            <h2 className="t-h3">What your teen will be able to do</h2>
            <ul className="t-body" style={{ color: "var(--ink-secondary)", paddingLeft: 20, margin: 0 }}>
              <li>Publish listings with photos, and browse other teens&apos; listings</li>
              <li>Message other users on the platform, where messages are moderated</li>
              <li>Make and receive offers, including item-for-item trades</li>
              <li>Arrange in-person handovers at verified public meetup locations</li>
            </ul>

            <h2 className="t-h3">Safety measures</h2>
            <ul className="t-body" style={{ color: "var(--ink-secondary)", paddingLeft: 20, margin: 0 }}>
              <li>Listings are screened automatically and flagged listings are reviewed by a person</li>
              <li>Meetups are steered to staffed, public places: MRT controls, libraries, community centres and mall counters</li>
              <li>Precise location is never stored or shown. Only a region, such as &quot;East&quot;</li>
              <li>Real names and phone numbers are never shown to other users</li>
              <li>Contact details typed into listings or messages are removed automatically</li>
              <li>Any user can report a listing, a user or a message, and reports are reviewed within 24 hours</li>
            </ul>

            <div
              style={{
                marginTop: "var(--space-5)",
                padding: "var(--space-4)",
                background: "var(--blue-subtle)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                gap: "var(--space-3)",
              }}
            >
              <span style={{ color: "var(--blue-primary)", flexShrink: 0 }}>
                <Icon name="info" size={20} />
              </span>
              <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>
                {PAYMENT_DISCLAIMER} We recommend your teen brings someone with them to every handover.
              </p>
            </div>
          </section>

          <div className="panel" style={{ marginTop: "var(--space-6)" }}>
            <ConsentForm token={token} username={user.username} />
          </div>
        </>
      )}
    </div>
  );
}
