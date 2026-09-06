import { apiError, apiOk, readJson } from "@/lib/api";
import { getUserByConsentToken, notify, recordEvent, updateUser } from "@/lib/data";

const CONSENT_WINDOW_MS = 7 * 864e5;

/**
 * 12.1 POST /auth/parent-consent/{token} — public. 9.2 activates the teen's
 * account once a parent or guardian confirms.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await readJson<{ parent_name?: string; confirmed?: boolean }>(request);

  const user = await getUserByConsentToken(token);
  if (!user) {
    return apiError("VALIDATION_FAILED", "This confirmation link is not valid. Ask your teen to resend it.");
  }
  if (user.parent_consent_at) {
    return apiOk({ already_confirmed: true, username: user.username });
  }

  const sentAt = user.parent_consent_sent_at ? new Date(user.parent_consent_sent_at).getTime() : 0;
  if (Date.now() - sentAt > CONSENT_WINDOW_MS) {
    return apiError(
      "VALIDATION_FAILED",
      "This confirmation link has expired. Ask your teen to resend it from their account.",
    );
  }

  if (!body?.confirmed) {
    return apiError("VALIDATION_FAILED", "Tick the box to confirm you are the parent or guardian.", {
      field: "confirmed",
    });
  }
  if ((body.parent_name ?? "").trim().length < 2) {
    return apiError("VALIDATION_FAILED", "Enter your name so we have a record of who gave consent.", {
      field: "parent_name",
    });
  }

  const consentedAt = new Date().toISOString();
  await updateUser(user.id, {
    account_status: "active",
    parent_consent_at: consentedAt,
    // Single-use: the link cannot be replayed once consent is recorded.
    parent_consent_token: null,
  });

  await notify(
    user.id,
    "consent",
    "Your account is active",
    "Your parent or guardian confirmed your account. You can now list items and message other teens.",
    "/sell/new",
  );

  const hoursSinceSignup = Math.round((Date.now() - new Date(user.created_at).getTime()) / 36e5);
  await recordEvent("parental_consent_granted", user.id, { hours_since_signup: hoursSinceSignup });

  return apiOk({ confirmed: true, username: user.username });
}
