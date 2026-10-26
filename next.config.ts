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
  // server.mjs resolves the catalog root (and the files under it) from
  // request/env-driven paths, which the build's file tracer can't follow
  // statically — it falls back to tracing the whole project for this route
  // (confirmed: an untraced build pulled in all 392MB of the `vendor/`
  // submodule alone). Give it the real, narrow file list explicitly instead.
  outputFileTracingIncludes: {
    "/api/catalog": ["./catalog-api/public/**/*"],
  },
  outputFileTracingExcludes: {
    "/api/catalog": [
      "./vendor/**/*",
      "./docs/**/*",
      "./test/**/*",
      "./catalog-deploy/**/*",
      "./app/**/*",
      "./components/**/*",
    ],
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
