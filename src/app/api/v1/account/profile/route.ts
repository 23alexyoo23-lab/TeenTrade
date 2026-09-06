import { apiError, apiOk, readJson, requireUser } from "@/lib/api";
import { isValidUsername } from "@/lib/auth";
import { REGIONS } from "@/lib/constants";
import { getUserByUsername, updateUser } from "@/lib/data";
import type { Region } from "@/lib/types";

/** Updates the editable slice of the profile. */
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await readJson<{ username?: string; region?: string }>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const username = body.username?.trim().toLowerCase();
  if (username && username !== auth.user.username) {
    if (!isValidUsername(username)) {
      return apiError(
        "VALIDATION_FAILED",
        "Usernames use 3 to 30 lowercase letters, numbers or underscores.",
        { field: "username" },
      );
    }
    if (await getUserByUsername(username)) {
      return apiError("VALIDATION_FAILED", "That username is taken. Try another.", { field: "username" });
    }
  }

  const region = REGIONS.some((r) => r.value === body.region) ? (body.region as Region) : undefined;

  await updateUser(auth.user.id, {
    ...(username ? { username } : {}),
    ...(region ? { region } : {}),
  });

  return apiOk({ username: username ?? auth.user.username, region: region ?? auth.user.region });
}
