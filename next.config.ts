import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-5dab37d5-8eea-496f-bf0c-1677680dd1d3.space-z.ai",
  ],
};

export default nextConfig;
