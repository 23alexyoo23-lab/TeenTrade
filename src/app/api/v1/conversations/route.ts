import { apiOk, requireUser } from "@/lib/api";
import {
  conversationsFor,
  getListing,
  getUserById,
  lastMessageIn,
  toPublicUser,
  unreadCountIn,
} from "@/lib/data";

/** 12.5 GET /conversations — with last message preview and unread count. */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const conversations = await conversationsFor(user.id);

  const data = await Promise.all(
    conversations.map(async (conversation) => {
      const otherId = conversation.participant_ids.find((id) => id !== user.id);
      const other = otherId ? await getUserById(otherId) : undefined;
      const last = await lastMessageIn(conversation.id);

      return {
        id: conversation.id,
        listing: conversation.listing_id
          ? await getListing(conversation.listing_id, user.id)
          : null,
        participant: other ? toPublicUser(other) : null,
        last_message: last
          ? { body: last.body, sender_id: last.sender_id, created_at: last.created_at, kind: last.kind }
          : null,
        unread_count: await unreadCountIn(conversation.id, user.id),
        updated_at: conversation.updated_at,
      };
    }),
  );

  return apiOk({ data });
}
