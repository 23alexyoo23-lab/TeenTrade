import { currentUser as clerkUser } from "@clerk/nextjs/server";
import { apiError, apiOk, rateLimit, readJson } from "@/lib/api";
import {
  ageBracket,
  currentClerkUserId,
  decideOnAge,
  isValidEmail,
  isValidSgPhone,
  isValidUsername,
  normaliseSgPhone,
} from "@/lib/auth";
import { encryptField, newId, newToken } from "@/lib/crypto";
import {
  createUser,
  getUserByClerkId,
  getUserByUsername,
  notify,
  recordEvent,
} from "@/lib/data";
import { REGIONS } from "@/lib/constants";
import { verifyOtp } from "@/lib/otp";
import type { Region, User } from "@/lib/types";

interface OnboardingBody {
  date_of_birth?: string;
  parent_email?: string | null;
  phone_number?: string;
  otp?: string;
  username?: string;
  region?: string;
  accepted_guidelines?: boolean;
}

/**
 * Completes a TeenTrade profile for an account Clerk has already created.
 *
 * Clerk handles the email and password at /signup. Everything TeenTrade needs
 * on top of that — 9.1 age verification, phone verification and 9.2 parental
 * consent — is collected here, and the profile row is only written once it all
 * passes. Until then the Clerk user has no TeenTrade profile and is treated as
 * signed out everywhere else.
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
  const phone = body.phone_number?.trim() ?? "";

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

  if (!isValidSgPhone(phone)) {
    return apiError("VALIDATION_FAILED", "Enter a Singapore mobile number.", {
      field: "phone_number",
    });
  }
  if (!verifyOtp(normaliseSgPhone(phone), body.otp?.trim() ?? "")) {
    return apiError(
      "VALIDATION_FAILED",
      "That code is not right, or it has expired. Send a new one.",
      { field: "otp" },
    );
  }

  const parentEmail = body.parent_email?.trim().toLowerCase() ?? "";
  if (decision.requiresParentalConsent && !isValidEmail(parentEmail)) {
    return apiError(
      "VALIDATION_FAILED",
      "Enter a valid email address for your parent or guardian.",
      { field: "parent_email" },
    );
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
  const consentToken = decision.requiresParentalConsent ? newToken() : null;

  const user: User = {
    id: newId(),
    clerk_id: clerkId,
    username,
    email,
    date_of_birth: body.date_of_birth!,
    // 10.5 — phone numbers and parent emails are encrypted at rest.
    phone_number: encryptField(normaliseSgPhone(phone)),
    phone_verified: true,
    avatar_url: account?.imageUrl ?? null,
    region,
    account_status: decision.requiresParentalConsent ? "pending_consent" : "active",
    parent_email: decision.requiresParentalConsent ? encryptField(parentEmail) : null,
    parent_consent_at: null,
    parent_consent_token: consentToken,
    parent_consent_sent_at: decision.requiresParentalConsent ? now : null,
    rating_average: null,
    rating_count: 0,
    last_active_at: now,
    created_at: now,
    deleted_at: null,
  };

  await createUser(user);

  if (decision.requiresParentalConsent) {
    // The email itself is delivered by the mail provider in production.
    console.info(`[teentrade] Consent link for ${username}: /parent-consent/${consentToken}`);
  } else {
    await notify(
      user.id,
      "listing_status",
      "Welcome to TeenTrade",
      "List your first item to get started.",
      "/sell/new",
    );
  }

  await recordEvent("signup_completed", user.id, {
    age_bracket: ageBracket(decision.age),
    required_parental_consent: decision.requiresParentalConsent,
  });

  return apiOk(
    {
      id: user.id,
      username: user.username,
      account_status: user.account_status,
      requires_parental_consent: decision.requiresParentalConsent,
      age_bracket: ageBracket(decision.age),
    },
    201,
  );
}
