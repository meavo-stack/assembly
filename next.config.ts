import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@meavo/navigation"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
