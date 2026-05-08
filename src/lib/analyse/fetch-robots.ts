import { assertPublicHttpUrl } from "@/lib/urlUtils";

const ROBOTS_TIMEOUT_MS = 5000;

export async function fetchRobotsTxt(finalUrl: string): Promise<string | undefined> {
  let robotsUrl: string;

  try {
    const safeFinalUrl = await assertPublicHttpUrl(finalUrl);
    robotsUrl = new URL("/robots.txt", safeFinalUrl).toString();
    await assertPublicHttpUrl(robotsUrl);
  } catch {
    return undefined;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROBOTS_TIMEOUT_MS);

  try {
    const response = await fetch(robotsUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "text/plain,*/*",
        "user-agent": "ShophebelAnalyseBot/1.0",
      },
    });

    if (!response.ok) {
      return undefined;
    }

    try {
      await assertPublicHttpUrl(response.url || robotsUrl);
    } catch {
      return undefined;
    }

    const text = await response.text();
    return text.trim() ? text : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
