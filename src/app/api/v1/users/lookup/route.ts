import { apiError, apiOk, requireUser } from "@/lib/api";
import { getUserByUsername, toPublicUser } from "@/lib/data";

/** Resolves a username to a public user, used by the safety hub report flow. */
export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
  if (!username) {
    return apiError("VALIDATION_FAILED", "Enter a username.", { field: "username" });
  }

  const user = await getUserByUsername(username.replace(/^@/, ""));
  if (!user) return apiError("USER_NOT_FOUND", "We could not find a user with that username.");

  return apiOk(toPublicUser(user));
}
