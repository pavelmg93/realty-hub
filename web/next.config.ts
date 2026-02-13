import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for photos and documents
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
