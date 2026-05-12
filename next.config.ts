import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/analyse": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/analyze": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
