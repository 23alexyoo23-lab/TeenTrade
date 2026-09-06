/**
 * Client-side image handling for the listing flow (8.4).
 *
 * Photos are compressed to 1600px on the longest edge before upload, and a
 * 400px thumbnail is produced alongside so the card and strip surfaces never
 * pull the full-size file.
 */

export const MAX_PHOTOS = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

export const MESSAGES = {
  unsupportedType: "That file type is not supported. Use JPG, PNG or HEIC.",
  tooLarge: "This photo is too large. Maximum size is 10MB.",
  limitReached: "You have reached the 10 photo limit.",
  needOne: "Add at least one photo to continue.",
};

export interface ProcessedImage {
  id: string;
  url: string;
  thumbnail_url: string;
  name: string;
}

export function validateFile(file: File): string | null {
  // Some browsers report an empty type for HEIC, so fall back to the extension.
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk =
    ACCEPTED_TYPES.includes(file.type) ||
    ["jpg", "jpeg", "png", "heic", "heif", "webp"].includes(extension);

  if (!typeOk) return MESSAGES.unsupportedType;
  if (file.size > MAX_FILE_BYTES) return MESSAGES.tooLarge;
  return null;
}

async function drawToDataUrl(source: ImageBitmap | HTMLImageElement, maxEdge: number): Promise<string> {
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  const scale = Math.min(1, maxEdge / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // HEIC and some WebP variants fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not read that image"));
      image.src = url;
    });
  } finally {
    // Revoked on the next tick so the decode has already happened.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function processImage(file: File): Promise<{ url: string; thumbnail_url: string }> {
  const source = await loadImage(file);
  const [url, thumbnail_url] = await Promise.all([
    drawToDataUrl(source, 1600),
    drawToDataUrl(source, 400),
  ]);

  if ("close" in source && typeof source.close === "function") source.close();

  return { url, thumbnail_url };
}
