import { apiError, apiOk, rateLimit, readJson, requireActive, requireUser } from "@/lib/api";
import { newId } from "@/lib/crypto";
import {
  addMessage,
  getConversation,
  getListing,
  isBlockedEitherWay,
  messagesIn,
  notify,
  recordEvent,
} from "@/lib/data";
import { scanMessage } from "@/lib/moderation";

/** 12.5 GET /conversations/{id}/messages */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation || !conversation.participant_ids.includes(auth.user.id)) {
    return apiError("CONVERSATION_NOT_FOUND", "We could not find that conversation.");
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);
  const all = await messagesIn(id);

  // Newest first per the spec, paginated from the end of the thread.
  return apiOk({
    data: all.slice(-limit).reverse(),
    meta: { total: all.length, limit },
  });
}

/** 12.5 POST /conversations/{id}/messages — content is scanned before delivery. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const inactive = requireActive(auth.user);
  if (inactive) return inactive;

  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation || !conversation.participant_ids.includes(auth.user.id)) {
    return apiError("CONVERSATION_NOT_FOUND", "We could not find that conversation.");
  }

  const otherId = conversation.participant_ids.find((participant) => participant !== auth.user.id);
  // 10.3 — a blocked user cannot open or continue a conversation with the blocker.
  if (otherId && await isBlockedEitherWay(auth.user.id, otherId)) {
    return apiError("USER_BLOCKED", "You cannot message this person.");
  }

  if (!rateLimit(`messages:${auth.user.id}`, 60, 60_000)) {
    return apiError("RATE_LIMITED", "You are sending messages very quickly. Wait a moment.");
  }

  const body = await readJson<{ body?: string }>(request);
  const text = (body?.body ?? "").trim();
  if (!text) {
    return apiError("VALIDATION_FAILED", "Write a message before sending.", { field: "body" });
  }
  if (text.length > 2000) {
    return apiError("VALIDATION_FAILED", "Messages can be up to 2000 characters.", { field: "body" });
  }

  // 10.1 — contact details are stripped so conversations stay on-platform.
  const scanned = scanMessage(text);
  const isFirst = (await messagesIn(id)).filter((m) => m.kind === "text").length === 0;

  const message = await addMessage({
    id: newId(),
    conversation_id: id,
    sender_id: auth.user.id,
    body: scanned.body,
    redacted: scanned.redacted,
    kind: "text",
    read_by: [auth.user.id],
    created_at: new Date().toISOString(),
  });

  if (otherId) {
    const listing = conversation.listing_id ? await getListing(conversation.listing_id, otherId) : null;
    await notify(
      otherId,
      "message",
      "New message",
      listing
        ? `@${auth.user.username} messaged you about "${listing.title}".`
        : `@${auth.user.username} sent you a message.`,
      `/messages/${id}`,
    );
  }

  await recordEvent("message_sent", auth.user.id, { conversation_id: id, is_first_in_thread: isFirst });

  return apiOk({ ...message, warning: scanned.redacted ? "contact_details_removed" : null }, 201);
}
