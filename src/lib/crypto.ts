import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * At-rest field encryption and id generation.
 *
 * Password hashing and session signing used to live here. Clerk owns both now,
 * so those functions are gone — passwords never reach this application.
 */

function secret(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/**
 * The dev fallback keeps `npm run dev` working with no .env. In production this
 * environment variable must be set — see README.
 */
const FIELD_KEY = scryptSync(
  secret("FIELD_ENCRYPTION_KEY", "teentrade-dev-field-key-change-me"),
  "teentrade-field",
  32,
);

/**
 * 10.5 — phone numbers and parent emails are encrypted at rest. AES-256-GCM
 * with a per-value IV.
 */
export function encryptField(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", FIELD_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptField(value: string | null): string | null {
  if (!value) return null;
  const [iv, tag, data] = value.split(".");
  if (!iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", FIELD_KEY, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function newId(): string {
  return crypto.randomUUID();
}

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}
