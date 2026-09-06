/**
 * Client-side analytics dispatch — PRD section 14.1.
 *
 * Events are posted to /api/v1/events, which appends them to the local event
 * log. In production this would forward to the warehouse that backs the
 * dashboards in 14.3.
 */

export type AnalyticsEventName =
  | "signup_started"
  | "signup_completed"
  | "parental_consent_granted"
  | "search_performed"
  | "filter_applied"
  | "listing_viewed"
  | "listing_saved"
  | "listing_flow_started"
  | "listing_step_completed"
  | "listing_flow_abandoned"
  | "listing_published"
  | "offer_sent"
  | "offer_responded"
  | "transaction_completed"
  | "message_sent"
  | "report_filed"
  | "user_blocked";

export function track(name: AnalyticsEventName, properties: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({ name, properties });

  // sendBeacon survives navigation, which matters for funnel-exit events such
  // as listing_flow_abandoned.
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/events", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break a user flow.
  });
}
