import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { redirectIfSignedIn } from "@/lib/auth";

export const metadata = { title: "Log in" };

/**
 * Clerk renders the form itself. This is an optional catch-all segment because
 * Clerk routes its own sub-steps (email verification, factor two, password
 * reset) underneath /login.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await redirectIfSignedIn();

  const { next } = await searchParams;

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 480 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Log in</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)" }}>
        Welcome back. Log in to keep buying, selling and trading.
      </p>

      <div style={{ marginTop: "var(--space-6)", display: "flex", justifyContent: "center" }}>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl={next ?? "/"}
        />
      </div>

      <p className="t-body" style={{ marginTop: "var(--space-5)", textAlign: "center" }}>
        New here?{" "}
        <Link href="/signup" style={{ color: "var(--blue-link)" }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
