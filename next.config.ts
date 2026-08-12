import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@privy-io/react-auth", "@privy-io/server-auth"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  turbopack: {
    resolveAlias: {
      "node:worker_threads": path.join(__dirname, "src/lib/empty-module.ts"),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "node:worker_threads": path.join(__dirname, "src/lib/empty-module.ts"),
    };
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
