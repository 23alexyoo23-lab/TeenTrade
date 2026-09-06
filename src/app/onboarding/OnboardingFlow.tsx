"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Banner } from "@/components/ui";
import { REGIONS } from "@/lib/constants";
import { track } from "@/lib/analytics";
import type { Region } from "@/lib/types";

/**
 * 9.1 age verification and 9.2 parental consent, for an account Clerk has
 * already created.
 *
 * Clerk collected the email and password at /signup. What is left is what
 * TeenTrade needs and Clerk does not do: date of birth -> phone verification ->
 * profile and community guidelines.
 */
type Step = "age" | "phone" | "profile";

const STEP_LABELS: { id: Step; label: string }[] = [
  { id: "age", label: "Your age" },
  { id: "phone", label: "Verify" },
  { id: "profile", label: "Profile" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("age");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [needsConsent, setNeedsConsent] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

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

    setNeedsConsent(age < 16);
    setStep("phone");
  }

  async function sendOtp() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "We could not send the code.");
        return;
      }
      setOtpSent(true);
      // In production the code arrives by SMS. Locally it is returned so the
      // flow can be completed without an SMS provider.
      setDevCode(body.dev_code ?? null);
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
          parent_email: needsConsent ? parentEmail : null,
          phone_number: phone,
          otp,
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

      track("signup_completed", {
        age_bracket: body.age_bracket,
        required_parental_consent: body.requires_parental_consent,
      });

      router.push(body.requires_parental_consent ? "/signup/pending" : "/");
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

      {step === "phone" ? (
        <>
          {needsConsent ? (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <Banner tone="amber" icon="users" title="A parent or guardian needs to approve your account">
                Because you are under 16, we will email your parent or guardian a link to confirm. You can
                browse straight away, and you will be able to list and message once they confirm.
              </Banner>
            </div>
          ) : null}

          {needsConsent ? (
            <Field label="Parent or guardian email" htmlFor="onboarding-parent-email">
              <input
                id="onboarding-parent-email"
                className="input"
                type="email"
                required
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
              />
            </Field>
          ) : null}

          <Field
            label="Mobile number"
            htmlFor="onboarding-phone"
            help="Singapore numbers only. We never show your number to other users."
          >
            <input
              id="onboarding-phone"
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="9123 4567"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>

          {otpSent ? (
            <Field label="Verification code" htmlFor="onboarding-otp" help="We sent a 6-digit code by SMS.">
              <input
                id="onboarding-otp"
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              />
              {devCode ? (
                <p className="t-caption" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
                  Development build: your code is <strong>{devCode}</strong>.
                </p>
              ) : null}
            </Field>
          ) : null}

          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("age")}>
              Back
            </button>
            {otpSent ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (otp.length !== 6) {
                    setError("Enter the 6-digit code we sent you.");
                    return;
                  }
                  if (needsConsent && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(parentEmail)) {
                    setError("Enter a valid email address for your parent or guardian.");
                    return;
                  }
                  setError(null);
                  setStep("profile");
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={sendOtp}
                disabled={submitting}
              >
                {submitting ? <span className="btn-spinner" /> : "Send code"}
              </button>
            )}
          </div>
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
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("phone")}>
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
