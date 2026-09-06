import { apiError, apiOk, rateLimit, readJson, requireUser } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/constants";
import { newId } from "@/lib/crypto";
import { createReport, getRawListing, getUserById, recordEvent } from "@/lib/data";
import type { Report, ReportReason, ReportTargetType } from "@/lib/types";

const MIN_DETAIL_LENGTH = 20;

interface ReportBody {
  target_type?: ReportTargetType;
  target_id?: string;
  reason?: ReportReason;
  details?: string;
  attachment_url?: string | null;
}

/** 12.6 POST /reports — 9.6 report flow. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!rateLimit(`report:${auth.user.id}`, 10, 60 * 60 * 1000)) {
    return apiError("RATE_LIMITED", "You have filed several reports recently. Try again in an hour.");
  }

  const body = await readJson<ReportBody>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  if (!body.target_type || !["listing", "user", "message"].includes(body.target_type)) {
    return apiError("VALIDATION_FAILED", "We could not tell what you are reporting.", {
      field: "target_type",
    });
  }
  if (!body.target_id) {
    return apiError("VALIDATION_FAILED", "We could not tell what you are reporting.", { field: "target_id" });
  }
  if (!body.reason || !REPORT_REASONS.some((r) => r.value === body.reason)) {
    return apiError("VALIDATION_FAILED", "Choose a reason so we know what to look at.", { field: "reason" });
  }
  if ((body.details ?? "").trim().length < MIN_DETAIL_LENGTH) {
    return apiError(
      "VALIDATION_FAILED",
      `Tell us a bit more. At least ${MIN_DETAIL_LENGTH} characters helps our team act quickly.`,
      { field: "details" },
    );
  }

  // Confirm the target exists so the moderation queue is not filled with noise.
  if (body.target_type === "listing" && !await getRawListing(body.target_id)) {
    return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  }
  if (body.target_type === "user" && !await getUserById(body.target_id)) {
    return apiError("USER_NOT_FOUND", "We could not find that user.");
  }

  const report: Report = {
    id: newId(),
    reporter_id: auth.user.id,
    target_type: body.target_type,
    target_id: body.target_id,
    reason: body.reason,
    details: body.details!.trim().slice(0, 2000),
    attachment_url: body.attachment_url ?? null,
    status: "open",
    resolution_note: null,
    resolved_by: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
  };

  await createReport(report);
  await recordEvent("report_filed", auth.user.id, { target_type: report.target_type, reason: report.reason });

  return apiOk({ id: report.id, status: report.status }, 201);
}
