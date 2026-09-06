import { apiError, apiOk, requireUser } from "@/lib/api";
import { getConversation, markConversationRead } from "@/lib/data";

/** 12.5 POST /conversations/{id}/read */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation || !conversation.participant_ids.includes(auth.user.id)) {
    return apiError("CONVERSATION_NOT_FOUND", "We could not find that conversation.");
  }

  await markConversationRead(id, auth.user.id);
  return apiOk({ read: true });
}
