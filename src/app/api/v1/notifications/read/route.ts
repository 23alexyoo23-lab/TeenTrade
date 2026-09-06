import { apiOk, requireUser } from "@/lib/api";
import { markNotificationsRead } from "@/lib/data";

/** Marks every notification for the current user as read. */
export async function POST() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  await markNotificationsRead(auth.user.id);
  return apiOk({ read: true });
}
