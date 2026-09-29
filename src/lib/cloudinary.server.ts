import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `paji-shoes/${folder}`, resource_type: resourceType },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Upload failed"));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId: string, resourceType: "image" | "video" = "image") {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
