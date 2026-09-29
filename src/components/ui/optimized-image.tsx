"use client";

import { cloudinaryUrl, type ImagePreset } from "@/lib/cloudinary-url";

type Props = {
  src: string;
  publicId?: string;
  alt: string;
  preset?: ImagePreset;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** Uses native img with Cloudinary URLs — avoids Vercel image pipeline for Cloudinary assets */
export function OptimizedImage({
  src,
  publicId,
  alt,
  preset = "product",
  className,
  width,
  height,
  priority,
}: Props) {
  const url = publicId ? cloudinaryUrl(publicId, preset) : src;
  if (!url) {
    return (
      <div
        className={className}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
