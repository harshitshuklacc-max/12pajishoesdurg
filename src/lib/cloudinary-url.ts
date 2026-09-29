/** Client-safe Cloudinary URL helpers (no Node SDK — safe for browser bundles). */

export type ImagePreset = "thumbnail" | "card" | "product" | "zoom" | "hero" | "category" | "logo";

const TRANSFORMS: Record<ImagePreset, string> = {
  thumbnail: "c_fill,w_120,h_120,q_auto,f_auto",
  card: "c_fill,w_400,h_500,q_auto,f_auto",
  product: "c_limit,w_800,q_auto,f_auto",
  zoom: "c_limit,w_1200,q_auto,f_auto",
  hero: "c_fill,w_1920,h_800,q_auto,f_auto",
  category: "c_fill,w_600,h_400,q_auto,f_auto",
  /** Full logo visible — no crop (homepage & branding) */
  logo: "c_limit,w_512,h_512,q_auto,f_auto",
};

export function cloudinaryUrl(
  publicIdOrUrl: string,
  preset: ImagePreset = "product",
  extra?: string
): string {
  if (!publicIdOrUrl) return "";
  if (publicIdOrUrl.startsWith("http")) {
    if (publicIdOrUrl.includes("res.cloudinary.com")) return publicIdOrUrl;
    return publicIdOrUrl;
  }
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "";
  if (!cloud) return publicIdOrUrl;
  const transform = extra ? `${TRANSFORMS[preset]},${extra}` : TRANSFORMS[preset];
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${publicIdOrUrl}`;
}

export function faviconFromLogo(publicId: string, size = 32): string {
  return cloudinaryUrl(publicId, "thumbnail", `c_fill,w_${size},h_${size},f_png`);
}

const ALLOWED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function validateUpload(file: File, type: "image" | "video"): string | null {
  const allowed = type === "image" ? ALLOWED_IMAGE : ALLOWED_VIDEO;
  const max = type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!allowed.includes(file.type)) return `Invalid file type: ${file.type}`;
  if (file.size > max) return `File too large (max ${max / 1024 / 1024}MB)`;
  return null;
}
