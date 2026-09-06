import { apiError, apiOk, readJson, requireActive, requireUser } from "@/lib/api";
import { ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/images";
import { newId } from "@/lib/crypto";

/**
 * 12.3 POST /uploads/presign.
 *
 * In production this returns a presigned S3 URL for a direct client upload.
 * This build stores compressed images inline with the listing, so the endpoint
 * validates the file and hands back an upload id and the constraints the
 * client must honour, keeping the contract in place for when object storage is
 * added.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const blocked = requireActive(auth.user);
  if (blocked) return blocked;

  const body = await readJson<{ content_type?: string; size_bytes?: number }>(request);
  if (!body?.content_type) {
    return apiError("VALIDATION_FAILED", "Tell us the file type you want to upload.", {
      field: "content_type",
    });
  }
  if (!ACCEPTED_TYPES.includes(body.content_type)) {
    return apiError("IMAGE_REJECTED", "That file type is not supported. Use JPG, PNG or HEIC.", {
      field: "content_type",
    });
  }
  if ((body.size_bytes ?? 0) > MAX_FILE_BYTES) {
    return apiError("IMAGE_REJECTED", "This photo is too large. Maximum size is 10MB.", {
      field: "size_bytes",
    });
  }

  return apiOk({
    upload_id: newId(),
    // The client posts the processed image to this endpoint instead of S3.
    upload_url: "/api/v1/listings/{id}/images",
    max_bytes: MAX_FILE_BYTES,
    max_longest_edge: 1600,
    thumbnail_longest_edge: 400,
  });
}
