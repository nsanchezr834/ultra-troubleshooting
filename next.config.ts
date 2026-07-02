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
      "sharp": false,
      "onnxruntime-node": false,
    },
    resolveFallback: {
      fs: false,
    }
  },
};

export default nextConfig;
