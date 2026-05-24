function normalizePublicUrl(value: string | undefined, fallback: string) {
  const url = value?.trim() || fallback;
  return url.replace(/\/+$/, "");
}

export const APP_URL = normalizePublicUrl(
  process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NODE_ENV === "production" ? "https://shophebel-analyse.vercel.app" : "http://localhost:3001",
);
export const SHOPHEBEL_HOME_URL = normalizePublicUrl(
  process.env.NEXT_PUBLIC_HOMEPAGE_URL ||
    process.env.NEXT_PUBLIC_SHOPHEBEL_HOME_URL,
  "https://shophebel.vercel.app",
);
export const ANALYSE_TOOL_URL = normalizePublicUrl(
  process.env.NEXT_PUBLIC_ANALYSE_APP_URL ||
    process.env.NEXT_PUBLIC_ANALYSE_TOOL_URL,
  APP_URL,
);
export const SCOUT_TOOL_URL = normalizePublicUrl(
  process.env.NEXT_PUBLIC_SCOUT_TOOL_URL,
  process.env.NODE_ENV === "production" ? "https://scout.shophebel.de" : "http://localhost:3002",
);
