import { randomUUID } from "crypto";

import { PublicUrlError, assertPublicHttpUrl } from "@/lib/urlUtils";
import { AnalysisScreenshots, PageRenderSignals, VisualMap } from "@/types/analysis";
import { BrowserLaunchError, launchBrowser } from "@/lib/analyse/browser";
import { captureAnalysisScreenshots } from "@/lib/analyse/screenshots";
import { collectVisualMap } from "@/lib/analyse/visual-map";
import { collectVisualSignals } from "@/lib/analyse/visual-signals";

const NAVIGATION_TIMEOUT_MS = 25000;

export class FetchRenderedHtmlError extends Error {}

export interface FetchRenderedHtmlResult {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  loadTimeMs?: number;
  pageTitle: string;
  visibleText: string;
  pageSignals: PageRenderSignals;
  visualMap: VisualMap;
  screenshots?: AnalysisScreenshots;
  screenshotError?: string;
}

interface PageMetrics {
  pageTitle: string;
  visibleText: string;
  pageSignals: PageRenderSignals;
}

export async function fetchRenderedHtml(
  inputUrl: string,
): Promise<FetchRenderedHtmlResult> {
  let requestedUrl: string;

  try {
    requestedUrl = (await assertPublicHttpUrl(inputUrl)).toString();
  } catch (error) {
    throw new FetchRenderedHtmlError(
      error instanceof Error ? error.message : "Die URL ist ungueltig.",
    );
  }

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  let page: Awaited<ReturnType<Awaited<ReturnType<typeof launchBrowser>>["newPage"]>> | null =
    null;

  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

    const navigationStartedAt = Date.now();
    await page.goto(requestedUrl, {
      waitUntil: "networkidle2",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    try {
      await assertPublicHttpUrl(page.url() || requestedUrl);
    } catch (error) {
      if (error instanceof PublicUrlError) {
        throw new FetchRenderedHtmlError(error.message);
      }

      throw error;
    }
    const loadTimeMs = Date.now() - navigationStartedAt;

    const html = await page.content();

    if (!html.trim()) {
      throw new FetchRenderedHtmlError(
        "Die sichtbare Seite enthaelt keine auswertbaren Inhalte.",
      );
    }

    const metrics = (await page.evaluate(() => {
      const bodyText = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";

      return {
        pageTitle: document.title?.trim() ?? "",
        visibleText: bodyText,
      };
    })) as Pick<PageMetrics, "pageTitle" | "visibleText">;
    const [pageSignals, visualMap] = await Promise.all([
      collectVisualSignals(page),
      collectVisualMap(page),
    ]);

    let screenshots: AnalysisScreenshots | undefined;
    let screenshotError: string | undefined;

    try {
      screenshots = await captureAnalysisScreenshots(page, `analysis-${randomUUID()}`);
    } catch (error) {
      screenshotError =
        error instanceof Error
          ? error.message
          : "Die visuelle Vorschau konnte nicht erstellt werden.";
    }

    return {
      requestedUrl,
      finalUrl: page.url() || requestedUrl,
      html,
      loadTimeMs,
      pageTitle: metrics.pageTitle,
      visibleText: metrics.visibleText,
      pageSignals,
      visualMap,
      screenshots,
      screenshotError,
    };
  } catch (error) {
    if (error instanceof FetchRenderedHtmlError || error instanceof BrowserLaunchError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Die Seite konnte nicht als echte Browseransicht geladen werden.";
    throw new FetchRenderedHtmlError(
      `Die Seite konnte nicht als echte Browseransicht geladen werden: ${message}`,
    );
  } finally {
    if (page) {
      await page.close().catch(() => undefined);
    }

    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
