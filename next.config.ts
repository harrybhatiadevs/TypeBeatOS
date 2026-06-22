import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit only the trimmed server bundle + its required deps; the Dockerfile
  // copies the resulting .next/standalone tree into a slim runner image.
  output: "standalone",
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
