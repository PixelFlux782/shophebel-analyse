import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/env";

const publicRoutes = ["/analyse", "/website-analyse", "/conversion-optimierung"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
}
