"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Banner } from "@/components/ui";
import { REGIONS } from "@/lib/constants";
import { track } from "@/lib/analytics";
import type { Region } from "@/lib/types";

/**
 * 9.1 age verification, for an account Clerk has already created.
 *
 * Clerk collected the email and password at /signup. What is left is what
 * TeenTrade needs and Clerk does not do: date of birth -> profile and
 * community guidelines.
 */
type Step = "age" | "profile";

const STEP_LABELS: { id: Step; label: string }[] = [
  { id: "age", label: "Your age" },
  { id: "profile", label: "Profile" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("age");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageBlocked, setAgeBlocked] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [region, setRegion] = useState<Region>("central");
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

  useEffect(() => {
    track("signup_started", { referrer: typeof document !== "undefined" ? document.referrer : "" });
  }, []);

  /** 9.1 — the age gate runs client-side for instant feedback and again on the server. */
  function checkAge() {
    setError(null);
    setAgeBlocked(null);

    if (!dateOfBirth) {
      setError("Enter your date of birth.");
      return;
    }

    const birth = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDelta = now.getMonth() - birth.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;

    if (age < 13) {
      setAgeBlocked("TeenTrade is for users aged 13 to 19.");
      return;
    }
    if (age > 19) {
      setAgeBlocked("TeenTrade is for teens only.");
      return;
    }

    setStep("profile");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!acceptedGuidelines) {
      setError("You need to accept the community guidelines to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
          username,
          region,
          accepted_guidelines: acceptedGuidelines,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? "We could not finish setting up your account.");
        return;
      }

      track("signup_completed", { age_bracket: body.age_bracket });

      router.push("/");
      router.refresh();
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentIndex = STEP_LABELS.findIndex((s) => s.id === step);

  return (
    <form onSubmit={submit} noValidate>
      <ol className="tt-steps" style={{ marginBottom: "var(--space-6)" }}>
        {STEP_LABELS.map((item, index) => (
          <li key={item.id} className="tt-step">
            <span
              className={`tt-step-circle ${
                index < currentIndex ? "is-complete" : index === currentIndex ? "is-active" : "is-upcoming"
              }`}
            >
              {index < currentIndex ? <Icon name="check" size={14} /> : index + 1}
            </span>
            <span
              className={`t-caption tt-step-label ${
                index === currentIndex ? "is-active" : index < currentIndex ? "is-complete" : ""
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      {error ? (
        <div style={{ marginBottom: "var(--space-4)" }} aria-live="polite">
          <Banner tone="error" icon="alert-triangle" title={error} />
        </div>
      ) : null}

      {step === "age" ? (
        <>
          <Field
            label="Date of birth"
            htmlFor="onboarding-dob"
            help="We use this to check you are a teen. It is never shown to other users."
          >
            <input
              id="onboarding-dob"
              className="input"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={dateOfBirth}
              onChange={(event) => {
                setDateOfBirth(event.target.value);
                setAgeBlocked(null);
              }}
            />
          </Field>

          {ageBlocked ? (
            <div style={{ marginBottom: "var(--space-4)" }} aria-live="polite">
              <Banner tone="error" icon="ban" title={ageBlocked}>
                We are sorry. TeenTrade is built specifically for teenagers, so we cannot create an
                account for you.
              </Banner>
            </div>
          ) : null}

          <button type="button" className="btn btn-primary btn-block" onClick={checkAge}>
            Continue
          </button>
        </>
      ) : null}

      {step === "profile" ? (
        <>
          <Field
            label="Username"
            htmlFor="onboarding-username"
            help="Lowercase letters, numbers and underscores. This is what other teens see, so do not use your full name."
          >
            <input
              id="onboarding-username"
              className="input"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            />
          </Field>

          <Field label="Region" htmlFor="onboarding-region" help="We show your region on listings, never your address.">
            <select
              id="onboarding-region"
              className="select"
              value={region}
              onChange={(event) => setRegion(event.target.value as Region)}
            >
              {REGIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {/* 9.1 — explicit checkbox, never pre-ticked. */}
          <label
            style={{
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "flex-start",
              marginBottom: "var(--space-6)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedGuidelines}
              onChange={(event) => setAcceptedGuidelines(event.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <span className="t-body" style={{ color: "var(--ink-secondary)" }}>
              I have read and accept the community guidelines. I will meet at verified locations, keep
              conversations on TeenTrade, and report anything that feels wrong.
            </span>
          </label>

          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("age")}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : "Finish setting up"}
            </button>
          </div>
        </>
      ) : null}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {help ? <p className="field-help">{help}</p> : null}
      {children}
    </div>
  );
}
