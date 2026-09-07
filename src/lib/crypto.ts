/**
 * Id generation.
 *
 * Password hashing and session signing used to live here; Clerk owns both now,
 * so passwords never reach this application. Field encryption lived here too,
 * for phone numbers and parent emails — neither is collected any more.
 */

export function newId(): string {
  return crypto.randomUUID();
}
