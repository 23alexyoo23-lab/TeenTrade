import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { getRawListing } from "@/lib/data";
import { publishListing, type PublishInput } from "@/lib/publish";

/** 12.2 POST /listings/{id}/publish — moves a draft to pending_review or active. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");
  if (listing.seller_id !== auth.user.id) {
    return apiError("NOT_LISTING_OWNER", "You can only publish your own listings.");
  }

  const body = await readJson<PublishInput>(request);
  if (!body) return apiError("VALIDATION_FAILED", "We could not read that request.");

  const result = await publishListing(auth.user, body, listing);
  if (!result.ok) {
    return apiError(result.code, result.message, { field: result.field });
  }

  return apiOk({ id: result.listing.id, status: result.listing.status, warnings: result.warnings });
}
