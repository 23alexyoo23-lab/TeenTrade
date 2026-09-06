import { apiError, apiOk, requireUser } from "@/lib/api";
import { blockUser, getUserById, recordEvent, unblockUser } from "@/lib/data";

/** 12.6 POST /users/{id}/block — 10.3. Blocking is silent. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (id === auth.user.id) {
    return apiError("VALIDATION_FAILED", "You cannot block yourself.");
  }
  if (!await getUserById(id)) {
    return apiError("USER_NOT_FOUND", "We could not find that user.");
  }

  await blockUser(auth.user.id, id);
  await recordEvent("user_blocked", auth.user.id, { source: "api" });

  return apiOk({ blocked: true });
}

/** 12.6 DELETE /users/{id}/block */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await unblockUser(auth.user.id, id);

  return apiOk({ blocked: false });
}
