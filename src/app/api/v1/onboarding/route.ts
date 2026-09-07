import { currentUser as clerkUser } from "@clerk/nextjs/server";
import { apiError, apiOk, rateLimit, readJson } from "@/lib/api";
import {
  ageBracket,
  currentClerkUserId,
  decideOnAge,
  isValidUsername,
} from "@/lib/auth";
import { newId } from "@/lib/crypto";
import {
  createUser,
  getUserByClerkId,
  getUserByUsername,
  notify,
  recordEvent,
} from "@/lib/data";
import { REGIONS } from "@/lib/constants";
import type { Region, User } from "@/lib/types";

interface OnboardingBody {
  date_of_birth?: string;
  username?: string;
  region?: string;
  accepted_guidelines?: boolean;
}

/**
 * Completes a TeenTrade profile for an account Clerk has already created.
 *
 * Clerk handles the email and password at /signup. What TeenTrade adds on top
 * is the 9.1 age gate, a username and a region. The profile row is only written
 * once that passes; until then the Clerk user has no TeenTrade profile and is
 * treated as signed out everywhere else, so the age check cannot be skipped.
 */
export async function POST(request: Request) {
  const clerkId = await currentClerkUserId();
  if (!clerkId) return apiError("UNAUTHENTICATED", "Log in to continue.");

  if (!rateLimit(`onboarding:${clerkId}`, 20, 60_000)) {
    return apiError("RATE_LIMITED", "Too many attempts. Wait a minute and try again.");
  }

  // Onboarding runs once. A second call must not create a second profile.
  if (await getUserByClerkId(clerkId)) {
    return apiError("VALIDATION_FAILED", "Your account is already set up.");
  }

  const body = await readJson<OnboardingBody>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const username = body.username?.trim().toLowerCase() ?? "";

  if (!isValidUsername(username)) {
    return apiError(
      "VALIDATION_FAILED",
      "Usernames use 3 to 30 lowercase letters, numbers or underscores.",
      { field: "username" },
    );
  }
  if (await getUserByUsername(username)) {
    return apiError("VALIDATION_FAILED", "That username is taken. Try another.", {
      field: "username",
    });
  }
  if (!body.accepted_guidelines) {
    return apiError(
      "VALIDATION_FAILED",
      "You need to accept the community guidelines to continue.",
      { field: "accepted_guidelines" },
    );
  }

  // 9.1 — the age gate.
  const decision = decideOnAge(body.date_of_birth ?? "");
  if (!decision.allowed) {
    return apiError("VALIDATION_FAILED", decision.message, { field: "date_of_birth" });
  }

  // The email on the profile is the verified one Clerk holds, not a free-text
  // field, so it cannot be used to claim someone else's address.
  const account = await clerkUser();
  const email = account?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  if (!email) {
    return apiError("VALIDATION_FAILED", "Your account has no verified email address yet.");
  }

  const region = (REGIONS.some((r) => r.value === body.region) ? body.region : "central") as Region;
  const now = new Date().toISOString();

  const user: User = {
    id: newId(),
    clerk_id: clerkId,
    username,
    email,
    date_of_birth: body.date_of_birth!,
    avatar_url: account?.imageUrl ?? null,
    region,
    account_status: "active",
    rating_average: null,
    rating_count: 0,
    last_active_at: now,
    created_at: now,
    deleted_at: null,
  };

  await createUser(user);

  await notify(
    user.id,
    "listing_status",
    "Welcome to TeenTrade",
    "List your first item to get started.",
    "/sell/new",
  );

  await recordEvent("signup_completed", user.id, {
    age_bracket: ageBracket(decision.age),
  });

  return apiOk(
    {
      id: user.id,
      username: user.username,
      account_status: user.account_status,
      age_bracket: ageBracket(decision.age),
    },
    201,
  );
}
