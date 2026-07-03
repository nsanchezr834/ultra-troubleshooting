import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "sharp$": false,
        "onnxruntime-node$": false,
      }
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      "sharp": "./lib/empty.js",
      "onnxruntime-node": "./lib/empty.js",
      "fs": "./lib/empty.js",
      "path": "./lib/empty.js",
      "os": "./lib/empty.js",
      "crypto": "./lib/empty.js",
    }
  },
};

export default nextConfig;
