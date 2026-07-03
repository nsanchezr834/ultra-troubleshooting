import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
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
    }
  },
};

export default nextConfig;
