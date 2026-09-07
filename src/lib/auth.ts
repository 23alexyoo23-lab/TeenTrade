import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MAX_AGE, MIN_AGE } from "./constants";
import { getUserByClerkId, touchUser } from "./data";
import { ageFromDob } from "./format";
import type { User } from "./types";

/**
 * Clerk owns authentication: signing up, logging in, passwords, the session
 * cookie and its expiry. This module maps the Clerk session onto the TeenTrade
 * profile in Supabase, and keeps the parts Clerk does not do — the age gate
 * (9.1) and account status.
 *
 * A signed-in Clerk user with no TeenTrade profile yet is treated as signed
 * out, so they are sent through /onboarding to complete the age gate before
 * they can reach anything.
 */

/**
 * Next signals control flow (dynamic rendering, redirects, not-found) by
 * throwing. Those must never be swallowed by the catch blocks below, or the
 * framework silently does the wrong thing.
 */
function isFrameworkSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_") || digest.startsWith("DYNAMIC_"));
}

/** The signed-in user's TeenTrade profile, or null. */
export async function currentUser(): Promise<User | null> {
  let clerkUserId: string | null = null;

  try {
    ({ userId: clerkUserId } = await auth());
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    // Called outside a request scope, or Clerk is not configured.
    return null;
  }
  if (!clerkUserId) return null;

  let user: User | undefined;
  try {
    user = await getUserByClerkId(clerkUserId);
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    // A database problem should not present as a crash on every page.
    console.error("[teentrade] Could not load the current user's profile:", error);
    return null;
  }

  if (!user) return null;
  if (user.account_status === "deleted" || user.account_status === "suspended") return null;

  // 11.2 — last_active_at is updated on each authenticated request.
  await touchUser(user.id);
  return user;
}

/**
 * The Clerk account id for the caller, whether or not they have finished
 * onboarding. Used by the onboarding routes, which run before a profile exists.
 */
export async function currentClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    return null;
  }
}

/**
 * Guard for the signed-out surfaces (/welcome, /login, /signup).
 *
 * Sends the caller onward if they should not be looking at a signed-out page:
 * home when they have a profile, and onboarding when Clerk knows them but the
 * profile does not exist yet. Without the second case a half-registered user
 * lands on /login, where Clerk refuses to render <SignIn/> because they are
 * already signed in, and there is no way forward.
 */
export async function redirectIfSignedIn(): Promise<void> {
  if (await currentUser()) redirect("/");
  if (await currentClerkUserId()) redirect("/onboarding");
}

/** True once a parent has consented, or when consent was never required. */
export function canTransact(user: User): boolean {
  return user.account_status === "active";
}

/**
 * 9.1 — the age gate. Returns what should happen next for a given date of
 * birth.
 */
export type AgeDecision =
  | { allowed: false; message: string }
  | { allowed: true; age: number };

export function decideOnAge(dateOfBirth: string, now = new Date()): AgeDecision {
  const parsed = new Date(dateOfBirth);
  if (Number.isNaN(parsed.getTime())) {
    return { allowed: false, message: "Enter your date of birth." };
  }
  if (parsed.getTime() > now.getTime()) {
    return { allowed: false, message: "That date is in the future. Check your date of birth." };
  }

  const age = ageFromDob(dateOfBirth, now);
  if (age < MIN_AGE) {
    return { allowed: false, message: `TeenTrade is for users aged ${MIN_AGE} to ${MAX_AGE}.` };
  }
  if (age > MAX_AGE) {
    return { allowed: false, message: "TeenTrade is for teens only." };
  }

  return { allowed: true, age };
}

/** 14.1 signup_completed reports an age bracket rather than an exact age. */
export function ageBracket(age: number): string {
  return age < 16 ? "13-15" : "16-19";
}

export function isValidUsername(username: string): boolean {
  // 11.2 — lowercase alphanumeric and underscore, up to 30 characters.
  return /^[a-z0-9_]{3,30}$/.test(username);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
