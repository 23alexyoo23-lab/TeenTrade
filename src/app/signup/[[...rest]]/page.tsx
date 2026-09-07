import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { redirectIfSignedIn } from "@/lib/auth";
import { MAX_AGE, MIN_AGE } from "@/lib/constants";

export const metadata = { title: "Create your account" };

/**
 * Step one of two. Clerk collects the email and password here; the age gate
 * (9.1) follows at /onboarding,
 * which is where Clerk sends people once the account exists.
 */
export default async function SignupPage() {
  await redirectIfSignedIn();

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 560 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Create your account</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)" }}>
        TeenTrade is for teens in Singapore aged {MIN_AGE} to {MAX_AGE}. We check every account.
      </p>

      <div style={{ marginTop: "var(--space-6)", display: "flex", justifyContent: "center" }}>
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/onboarding"
        />
      </div>

      <p className="t-caption" style={{ marginTop: "var(--space-5)", textAlign: "center", color: "var(--ink-muted)" }}>
        Next you will confirm your age and verify a Singapore mobile number.
      </p>

      <p className="t-body" style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--blue-link)" }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
