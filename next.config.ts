import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imlqliuwxxgpkskppydn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/analyse": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/analyze": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/analyse/result/*": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/premium-report/*/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
