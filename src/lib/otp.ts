import "server-only";

/**
 * 9.1 — SMS OTP for phone verification.
 *
 * There is no SMS provider wired up in this build, so codes are held in memory
 * and echoed back in development. Swapping in a provider means replacing
 * `deliver` below.
 */

const codes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function issueOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(phone, { code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  deliver(phone, code);
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = codes.get(phone);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    codes.delete(phone);
    return false;
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    codes.delete(phone);
    return false;
  }
  if (entry.code !== code) return false;

  codes.delete(phone);
  return true;
}

function deliver(phone: string, code: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[teentrade] OTP for ${phone}: ${code}`);
  }
  // Production: hand off to the SMS provider here.
}
