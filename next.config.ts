import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Embedded catalog API (see docs/catalog-hosting.md): /api/catalog is a
  // Pages API route wrapping vendor/cardgame/catalog's server.mjs verbatim.
  // These rewrites expose it at the real, spec-shaped paths instead of
  // forcing it under /api/*.
  async rewrites() {
    return [
      { source: "/data/v1/:path*", destination: "/api/catalog" },
      { source: "/healthz", destination: "/api/catalog" },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
