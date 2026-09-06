import { redirect } from "next/navigation";
import { OnboardingFlow } from "./OnboardingFlow";
import { currentClerkUserId, currentUser } from "@/lib/auth";
import { MAX_AGE, MIN_AGE } from "@/lib/constants";

export const metadata = { title: "Finish setting up" };

/**
 * Step two of signing up. Reached straight after Clerk creates the account.
 *
 * Anyone who already has a TeenTrade profile has done this, and anyone with no
 * Clerk session at all belongs at /signup.
 */
export default async function OnboardingPage() {
  const clerkId = await currentClerkUserId();
  if (!clerkId) redirect("/signup");

  const existing = await currentUser();
  if (existing) redirect("/");

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 560 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Finish setting up</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)" }}>
        Your account is created. TeenTrade is for teens in Singapore aged {MIN_AGE} to {MAX_AGE}, so
        we need a couple more things before you can start trading.
      </p>

      <div className="panel" style={{ marginTop: "var(--space-6)" }}>
        <OnboardingFlow />
      </div>
    </div>
  );
}
