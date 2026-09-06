import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { publishListing, type PublishInput } from "@/lib/publish";

/**
 * 12.2 POST /listings/{id}/publish, with the create-and-publish case handled
 * here so the three-step flow can save in one round trip.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const body = await readJson<PublishInput>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const result = await publishListing(auth.user, body, null);
  if (!result.ok) {
    return apiError(result.code, result.message, { field: result.field });
  }

  return apiOk(
    { id: result.listing.id, status: result.listing.status, warnings: result.warnings },
    201,
  );
}
