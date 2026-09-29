import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent Next from treating C:\Users\Harshit as the workspace root when a parent lockfile exists
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
