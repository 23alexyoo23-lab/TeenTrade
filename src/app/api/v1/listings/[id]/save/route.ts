import { apiError, apiOk, requireUser } from "@/lib/api";
import { getRawListing, recordEvent, saveListing, unsaveListing } from "@/lib/data";

/** 12.2 POST /listings/{id}/save */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const listing = await getRawListing(id);
  if (!listing) return apiError("LISTING_NOT_FOUND", "We could not find that listing.");

  await saveListing(auth.user.id, id);
  await recordEvent("listing_saved", auth.user.id, { listing_id: id, category: listing.category_id });

  return apiOk({ saved: true });
}

/** 12.2 DELETE /listings/{id}/save */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await unsaveListing(auth.user.id, id);

  return apiOk({ saved: false });
}
