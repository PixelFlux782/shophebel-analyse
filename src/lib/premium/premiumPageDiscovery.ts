import * as cheerio from "cheerio";

export type PremiumPageRole =
  | "home"
  | "offer"
  | "product"
  | "trust"
  | "contact"
  | "faq"
  | "pricing"
  | "unknown";

export type PremiumDiscoveredPage = {
  url: string;
  title?: string;
  label: string;
  role: PremiumPageRole;
  reason: string;
};

type DiscoverPremiumPagesOptions = {
  fetchHtml?: (url: string) => Promise<string>;
};

const MAX_PREMIUM_PAGES = 5;
const ROLE_PRIORITY: PremiumPageRole[] = ["offer", "product", "trust", "contact", "faq", "pricing", "unknown"];
const BLOCKED_PATH_PATTERN =
  /(login|signin|konto|account|admin|wp-admin|warenkorb|cart|basket|checkout|kasse|zahlung|payment|my-account|logout)/i;
const DOWNLOAD_PATTERN = /\.(pdf|png|jpe?g|gif|webp|svg|zip|rar|7z|docx?|xlsx?|pptx?|mp4|mov|mp3|wav)(?:$|\?)/i;

const ROLE_KEYWORDS: Record<Exclude<PremiumPageRole, "home" | "unknown">, RegExp[]> = {
  offer: [
    /angebot|angebote|leistung|leistungen|service|services|loesung|lösung|beratung|agentur|pakete/i,
  ],
  product: [
    /produkt|produkte|shop|kategorie|category|collections?|sortiment|catalog|katalog|store/i,
  ],
  trust: [
    /ueber-uns|über-uns|about|unternehmen|team|referenz|referenzen|kunden|bewertungen|reviews|projekte|case/i,
  ],
  contact: [
    /kontakt|contact|anfrage|termin|demo|erstgespraech|erstgespräch|beratung-buchen|call/i,
  ],
  faq: [
    /faq|fragen|hilfe|support/i,
  ],
  pricing: [
    /preis|preise|pricing|kosten|tarife/i,
  ],
};

function normalizeComparableHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function normalizePageUrl(url: URL) {
  url.hash = "";
  url.search = "";
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedInternalPage(candidate: URL, start: URL) {
  if (!/^https?:$/.test(candidate.protocol)) return false;
  if (normalizeComparableHost(candidate.hostname) !== normalizeComparableHost(start.hostname)) return false;
  if (DOWNLOAD_PATTERN.test(candidate.pathname)) return false;
  if (BLOCKED_PATH_PATTERN.test(decodeURIComponent(candidate.pathname))) return false;
  return true;
}

function textLabel(value: string | undefined, fallback: string) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function roleForLink(url: URL, label: string): PremiumPageRole {
  const haystack = `${decodeURIComponent(url.pathname)} ${label}`.toLowerCase();

  for (const [role, patterns] of Object.entries(ROLE_KEYWORDS) as Array<[Exclude<PremiumPageRole, "home" | "unknown">, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(haystack))) {
      return role;
    }
  }

  return "unknown";
}

function reasonForRole(role: PremiumPageRole) {
  const reasons: Record<PremiumPageRole, string> = {
    home: "Eingegebene Startseite als Ausgangspunkt der Premium-Systemanalyse.",
    offer: "Interner Link mit Angebots-, Leistungs- oder Service-Signal.",
    product: "Interner Link mit Produkt-, Shop- oder Kategorie-Signal.",
    trust: "Interner Link mit Vertrauens-, Team-, Referenz- oder Bewertungs-Signal.",
    contact: "Interner Link mit Kontakt-, Anfrage-, Termin- oder Beratungs-Signal.",
    faq: "Interner Link mit FAQ- oder Hilfe-Signal.",
    pricing: "Interner Link mit Preis- oder Tarif-Signal.",
    unknown: "Interner Link ohne klare Rolle; als ergänzende Seite nachrangig ausgewählt.",
  };

  return reasons[role];
}

function roleWeight(role: PremiumPageRole) {
  if (role === "home") return -1;
  const index = ROLE_PRIORITY.indexOf(role);
  return index >= 0 ? index : ROLE_PRIORITY.length;
}

function candidateScore(candidate: PremiumDiscoveredPage) {
  const pathDepth = safeUrl(candidate.url)?.pathname.split("/").filter(Boolean).length ?? 9;
  return roleWeight(candidate.role) * 100 + pathDepth * 4 + candidate.label.length / 100;
}

async function defaultFetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Shophebel Premium Page Discovery",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`premium_discovery_fetch_failed:${response.status}`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html")) {
      throw new Error("premium_discovery_non_html_response");
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverPremiumPages(
  startUrl: string,
  options: DiscoverPremiumPagesOptions = {},
): Promise<PremiumDiscoveredPage[]> {
  const start = safeUrl(startUrl);

  if (!start) {
    return [];
  }

  const normalizedStartUrl = normalizePageUrl(new URL(start));
  const home: PremiumDiscoveredPage = {
    url: normalizedStartUrl,
    label: "Startseite",
    role: "home",
    reason: reasonForRole("home"),
  };

  let html = "";

  try {
    html = await (options.fetchHtml ?? defaultFetchHtml)(normalizedStartUrl);
  } catch (error) {
    console.warn("[premium-discovery] start page discovery failed", {
      url: normalizedStartUrl,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return [home];
  }

  const $ = cheerio.load(html);
  home.title = textLabel($("title").first().text(), home.label);
  const candidates = new Map<string, PremiumDiscoveredPage>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();
    if (!href || /^(mailto|tel|javascript):/i.test(href)) return;

    let url: URL;
    try {
      url = new URL(href, normalizedStartUrl);
    } catch {
      return;
    }

    if (!isAllowedInternalPage(url, start)) return;

    const normalizedUrl = normalizePageUrl(url);
    if (normalizedUrl === normalizedStartUrl) return;
    if (candidates.has(normalizedUrl)) return;

    const label = textLabel($(element).text(), url.pathname.split("/").filter(Boolean).at(-1) ?? "Unterseite");
    const title = textLabel($(element).attr("title"), label);
    const role = roleForLink(url, `${label} ${title}`);

    candidates.set(normalizedUrl, {
      url: normalizedUrl,
      title,
      label,
      role,
      reason: reasonForRole(role),
    });
  });

  const selected = [...candidates.values()]
    .sort((left, right) => {
      const scoreDiff = candidateScore(left) - candidateScore(right);
      return scoreDiff !== 0 ? scoreDiff : left.url.localeCompare(right.url);
    })
    .slice(0, MAX_PREMIUM_PAGES - 1);

  return [home, ...selected];
}

export const premiumPageDiscoveryLimits = {
  maxPages: MAX_PREMIUM_PAGES,
};
