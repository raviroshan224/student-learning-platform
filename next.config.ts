import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.68'],
  // Explicitly set the workspace root so Turbopack doesn't pick up the
  // stray package-lock.json at C:\Users\shiwa\ and lose track of node_modules.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Images are served from S3/CDN — skip Next.js optimization to avoid
    // server-side download timeouts (504) and serve the original URLs directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "olp-uploads.s3.us-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
