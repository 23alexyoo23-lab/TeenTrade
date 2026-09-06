import "server-only";

import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import type { User } from "./types";

/**
 * 12.7 — every error response uses the same envelope, so the client can always
 * show an actionable message instead of a raw status code.
 */
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_TRANSACTION_TYPE"
  | "UNAUTHENTICATED"
  | "TOKEN_EXPIRED"
  | "ACCOUNT_PENDING_CONSENT"
  | "USER_BLOCKED"
  | "NOT_LISTING_OWNER"
  | "LISTING_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "OFFER_NOT_FOUND"
  | "CONVERSATION_NOT_FOUND"
  | "LISTING_ALREADY_RESERVED"
  | "PROHIBITED_ITEM"
  | "IMAGE_REJECTED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_FOR: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  INVALID_TRANSACTION_TYPE: 400,
  UNAUTHENTICATED: 401,
  TOKEN_EXPIRED: 401,
  ACCOUNT_PENDING_CONSENT: 403,
  USER_BLOCKED: 403,
  NOT_LISTING_OWNER: 403,
  LISTING_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  OFFER_NOT_FOUND: 404,
  CONVERSATION_NOT_FOUND: 404,
  LISTING_ALREADY_RESERVED: 409,
  PROHIBITED_ITEM: 422,
  IMAGE_REJECTED: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ErrorCode,
  message: string,
  options: { field?: string; details?: unknown[]; status?: number } = {},
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        field: options.field ?? null,
        details: options.details ?? [],
      },
    },
    { status: options.status ?? STATUS_FOR[code] },
  );
}

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data as object, { status });
}

/** Resolves the caller, or returns a 401 envelope. */
export async function requireUser(): Promise<{ user: User } | { response: NextResponse }> {
  const user = await currentUser();
  if (!user) {
    return { response: apiError("UNAUTHENTICATED", "Log in to continue.") };
  }
  return { user };
}

/**
 * 9.2 / 15.5 — accounts waiting on parental consent can browse but cannot
 * publish listings, send messages or make offers.
 */
export function requireActive(user: User): NextResponse | null {
  if (user.account_status === "pending_consent") {
    return apiError(
      "ACCOUNT_PENDING_CONSENT",
      "Your parent or guardian needs to confirm your account before you can do this.",
    );
  }
  if (user.account_status !== "active") {
    return apiError("UNAUTHENTICATED", "This account is not active.");
  }
  return null;
}

/**
 * 13.4 — in-process rate limiting. A real deployment would use a shared store;
 * the shape of the limit is what matters here.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

/** True when the key has already spent its budget, without consuming any. */
export function isRateLimited(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < Date.now()) return false;
  return bucket.count >= limit;
}

/** Consumes one unit of the budget. Used to count failures only. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

/** Clears a budget, for example after a successful login. */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
