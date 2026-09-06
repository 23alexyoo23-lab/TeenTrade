import { apiError, apiOk, rateLimit, readJson } from "@/lib/api";
import { isValidSgPhone, normaliseSgPhone } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";

/** 9.1 — sends the SMS verification code. Singapore numbers only. */
export async function POST(request: Request) {
  const body = await readJson<{ phone_number?: string }>(request);
  const phone = body?.phone_number?.trim() ?? "";

  if (!isValidSgPhone(phone)) {
    return apiError(
      "VALIDATION_FAILED",
      "Enter a Singapore mobile number, starting with 8 or 9.",
      { field: "phone_number" },
    );
  }

  const normalised = normaliseSgPhone(phone);
  if (!rateLimit(`otp:${normalised}`, 5, 15 * 60 * 1000)) {
    return apiError("RATE_LIMITED", "Too many codes requested. Wait 15 minutes and try again.");
  }

  const code = issueOtp(normalised);

  return apiOk({
    sent: true,
    // Development only: production returns nothing but `sent`.
    ...(process.env.NODE_ENV !== "production" ? { dev_code: code } : {}),
  });
}
