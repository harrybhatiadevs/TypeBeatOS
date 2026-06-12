import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep ffmpeg-static out of the webpack bundle so its binary path resolves
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    serverActions: {
      // Beat audio files can be large
      bodySizeLimit: "60mb",
    },
  },
};

export default nextConfig;
