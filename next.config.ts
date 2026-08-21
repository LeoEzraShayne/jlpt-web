import type { NextConfig } from "next";

const documentRoutes = [
  "/login",
  "/onboarding",
  "/today",
  "/grammar",
  "/grammar/:path*",
  "/study/:path*",
  "/review",
  "/history",
  "/history/:path*",
  "/profile",
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      {
        // Recover clients that cached the previous malformed permanent redirect.
        source: "/\\:path\\*",
        destination: "/redirect-recovery",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "query", key: "login", value: "success" }],
        destination: "/login?login=success",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      ...documentRoutes.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
