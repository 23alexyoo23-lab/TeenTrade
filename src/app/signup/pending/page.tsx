import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { currentUser } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";

export const metadata = { title: "Waiting for approval" };

/** 9.2 — landing page immediately after an under-16 account is created. */
export default async function PendingConsentPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.account_status === "active") redirect("/");

  const parentEmail = decryptField(user.parent_email);

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-full)",
          background: "var(--amber-subtle)",
          color: "var(--amber)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="mail" size={26} />
      </span>

      <h1 className="t-h1" style={{ margin: "var(--space-4) 0 var(--space-2)" }}>
        We emailed your parent or guardian
      </h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)", marginTop: 0 }}>
        {parentEmail ? (
          <>
            We sent a confirmation link to <strong>{parentEmail}</strong>. Once they confirm, your account
            unlocks straight away.
          </>
        ) : (
          <>Once your parent or guardian confirms, your account unlocks straight away.</>
        )}
      </p>

      <div style={{ marginTop: "var(--space-6)" }}>
        <Banner tone="info" icon="info" title="What you can do right now">
          You can browse listings and explore the safety hub. Listing items and messaging other teens open
          up as soon as your account is confirmed. The link expires after 7 days, and you can resend it from
          the banner at the top of any page.
        </Banner>
      </div>

      {process.env.NODE_ENV !== "production" && user.parent_consent_token ? (
        <div
          className="t-caption"
          style={{
            marginTop: "var(--space-6)",
            padding: "var(--space-4)",
            background: "var(--surface-subtle)",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Development build: open the consent link directly at{" "}
          <a href={`/parent-consent/${user.parent_consent_token}`} style={{ color: "var(--blue-link)" }}>
            /parent-consent/{user.parent_consent_token}
          </a>
          .
        </div>
      ) : null}
    </div>
  );
}
