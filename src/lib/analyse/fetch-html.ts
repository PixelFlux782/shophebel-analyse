import { PublicUrlError, assertPublicHttpUrl } from "@/lib/urlUtils";

const REQUEST_TIMEOUT_MS = 12000;

export class InvalidUrlError extends Error {}
export class FetchHtmlError extends Error {}

export interface FetchHtmlResult {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  loadTimeMs?: number;
}

export async function fetchHtml(inputUrl: string): Promise<FetchHtmlResult> {
  let requestedUrl: string;

  try {
    requestedUrl = (await assertPublicHttpUrl(inputUrl)).toString();
  } catch (error) {
    throw new InvalidUrlError(
      error instanceof Error ? error.message : "Die URL ist ungültig.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(requestedUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "ShophebelAnalyseBot/1.0",
      },
    });

    if (!response.ok) {
      throw new FetchHtmlError(
        `Die Startseite konnte nicht geladen werden (HTTP ${response.status}).`,
      );
    }

    try {
      await assertPublicHttpUrl(response.url || requestedUrl);
    } catch (error) {
      if (error instanceof PublicUrlError) {
        throw new FetchHtmlError(error.message);
      }

      throw error;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("text/html")) {
      throw new FetchHtmlError("Die angegebene URL liefert kein HTML-Dokument.");
    }

    const html = await response.text();

    if (!html.trim()) {
      throw new FetchHtmlError("Die geladene Seite enthält kein auswertbares HTML.");
    }

    return {
      requestedUrl,
      finalUrl: response.url || requestedUrl,
      html,
      loadTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error instanceof InvalidUrlError || error instanceof FetchHtmlError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchHtmlError("Zeitüberschreitung beim Abrufen der Startseite.");
    }

    throw new FetchHtmlError("Die Startseite konnte nicht geladen werden.");
  } finally {
    clearTimeout(timeout);
  }
}
