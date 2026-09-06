import { apiError, apiOk, readJson } from "@/lib/api";
import { isValidSgPhone, normaliseSgPhone } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";

/** 12.1 POST /auth/verify-phone */
export async function POST(request: Request) {
  const body = await readJson<{ phone_number?: string; otp?: string }>(request);
  const phone = body?.phone_number?.trim() ?? "";
  const otp = body?.otp?.trim() ?? "";

  if (!isValidSgPhone(phone)) {
    return apiError("VALIDATION_FAILED", "Enter a Singapore mobile number.", { field: "phone_number" });
  }
  if (!verifyOtp(normaliseSgPhone(phone), otp)) {
    return apiError("VALIDATION_FAILED", "That code is not right, or it has expired. Send a new one.", {
      field: "otp",
    });
  }

  return apiOk({ verified: true });
}
