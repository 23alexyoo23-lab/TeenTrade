import { headers } from "next/headers";
import { Webhook } from "svix";
import { getUserByClerkId, updateUser } from "@/lib/data";

/**
 * Keeps the TeenTrade profile in step with the Clerk account.
 *
 * Note that `user.created` deliberately does nothing. A profile needs a date of
 * birth, a username and a verified phone number, none of which Clerk collects,
 * so the row is written by /api/v1/onboarding once the age gate has passed.
 * Creating a stub here would let someone skip the age gate.
 */

interface ClerkEvent {
  type: string;
  data: {
    id: string;
    image_url?: string | null;
    email_addresses?: { id: string; email_address: string }[];
    primary_email_address_id?: string | null;
  };
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await request.text();

  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as ClerkEvent;
  } catch (error) {
    console.error("[teentrade] Clerk webhook verification failed:", error);
    return new Response("Verification failed", { status: 400 });
  }

  const profile = await getUserByClerkId(event.data.id);
  if (!profile) {
    // No TeenTrade profile yet (onboarding not finished), or already removed.
    return new Response("Ignored", { status: 200 });
  }

  switch (event.type) {
    case "user.updated": {
      const primary = event.data.email_addresses?.find(
        (address) => address.id === event.data.primary_email_address_id,
      );
      // Only write fields the event actually carried, so a payload without
      // image_url does not blank an avatar that is already set.
      await updateUser(profile.id, {
        ...(primary ? { email: primary.email_address.toLowerCase() } : {}),
        ...(event.data.image_url ? { avatar_url: event.data.image_url } : {}),
      });
      break;
    }

    // 10.6 — deleting the account soft-deletes the profile so listings and
    // conversations stay consistent for the people on the other side of them.
    case "user.deleted": {
      await updateUser(profile.id, {
        account_status: "deleted",
        deleted_at: new Date().toISOString(),
      });
      break;
    }

    default:
      break;
  }

  return new Response("Webhook received", { status: 200 });
}
