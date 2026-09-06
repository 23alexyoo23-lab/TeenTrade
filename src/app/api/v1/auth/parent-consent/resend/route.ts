import { apiError, apiOk, rateLimit, requireUser } from "@/lib/api";
import { newToken } from "@/lib/crypto";
import { updateUser } from "@/lib/data";

/** 9.2 — resend the consent email; the link is regenerated each time. */
export async function POST() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  if (user.account_status !== "pending_consent") {
    return apiError("VALIDATION_FAILED", "Your account is already active.");
  }
  if (!rateLimit(`consent-resend:${user.id}`, 3, 10 * 60 * 1000)) {
    return apiError("RATE_LIMITED", "You have resent this a few times already. Wait 10 minutes.");
  }

  const token = newToken();
  await updateUser(user.id, {
    parent_consent_token: token,
    parent_consent_sent_at: new Date().toISOString(),
  });

  console.info(`[teentrade] Consent link for ${user.username}: /parent-consent/${token}`);

  return apiOk({ sent: true });
}
