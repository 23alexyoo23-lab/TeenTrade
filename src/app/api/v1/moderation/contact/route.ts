import { apiError, apiOk, rateLimit, readJson, requireUser } from "@/lib/api";
import { newId } from "@/lib/crypto";
import { createReport, notify } from "@/lib/data";

const CATEGORIES = [
  "safety_concern",
  "account_problem",
  "listing_problem",
  "report_followup",
  "something_else",
];

/**
 * 8.7 section 4 — contact moderation. Messages land in the same queue as
 * reports so nothing is missed, with a 24-hour response commitment.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!rateLimit(`moderation-contact:${auth.user.id}`, 5, 60 * 60 * 1000)) {
    return apiError("RATE_LIMITED", "You have sent a few messages already. Try again in an hour.");
  }

  const body = await readJson<{ category?: string; message?: string }>(request);
  if (!body?.category || !CATEGORIES.includes(body.category)) {
    return apiError("VALIDATION_FAILED", "Choose what this is about.", { field: "category" });
  }
  if ((body.message ?? "").trim().length < 20) {
    return apiError("VALIDATION_FAILED", "Tell us a bit more so we can help. At least 20 characters.", {
      field: "message",
    });
  }

  await createReport({
    id: newId(),
    reporter_id: auth.user.id,
    target_type: "user",
    // A contact message is about the sender's own situation, not a third party.
    target_id: auth.user.id,
    reason: "other",
    details: `[${body.category}] ${body.message!.trim()}`.slice(0, 2000),
    attachment_url: null,
    status: "open",
    resolution_note: null,
    resolved_by: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
  });

  await notify(
    auth.user.id,
    "report",
    "Message received",
    "Our moderation team will reply within 24 hours.",
    "/safety#contact-moderation",
  );

  return apiOk({ received: true, response_within_hours: 24 }, 201);
}
