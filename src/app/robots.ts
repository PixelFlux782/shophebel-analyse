import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/analyse", "/website-analyse", "/conversion-optimierung"],
        disallow: [
          "/admin/",
          "/api/",
          "/analyse/result/",
          "/checkout/",
          "/premium-report/",
          "/reports/",
          "/result/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
