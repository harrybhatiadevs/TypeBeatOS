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
    // Routes run through middleware (headers/request-id), which otherwise caps
    // the request body at 10MB and truncates large audio uploads → the
    // multipart body fails to parse and createBeat 500s. Match the action limit.
    middlewareClientMaxBodySize: "60mb",
  },
};

export default nextConfig;
