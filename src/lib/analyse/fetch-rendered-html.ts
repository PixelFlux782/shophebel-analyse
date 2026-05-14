import { randomUUID } from "crypto";

import { PublicUrlError, assertPublicHttpUrl } from "@/lib/urlUtils";
import { AnalysisMetadata, AnalysisScreenshots, PageRenderSignals, VisualMap } from "@/types/analysis";
import { BrowserLaunchError, launchBrowser } from "@/lib/analyse/browser";
import { ScreenshotCaptureDiagnostics, captureAnalysisScreenshots } from "@/lib/analyse/screenshots";
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
  screenshotErrorSource?: AnalysisMetadata["screenshotErrorSource"];
  screenshotVariantFailures?: AnalysisMetadata["screenshotVariantFailures"];
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
      error instanceof Error ? error.message : "Die URL ist ungültig.",
    );
  }

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  let page: Awaited<ReturnType<Awaited<ReturnType<typeof launchBrowser>>["newPage"]>> | null =
    null;

  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    console.info("[analysis] browser page created", {
      requestedUrl,
    });
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
        "Die sichtbare Seite enthält keine auswertbaren Inhalte.",
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
    let screenshotErrorSource: AnalysisMetadata["screenshotErrorSource"] | undefined;
    let screenshotVariantFailures: AnalysisMetadata["screenshotVariantFailures"] | undefined;
    const screenshotDiagnostics: ScreenshotCaptureDiagnostics = {
      failures: [],
      storageMisses: [],
    };

    try {
      console.info("[analysis] captureAnalysisScreenshots starting", {
        requestedUrl,
        finalUrl: page.url() || requestedUrl,
      });
      screenshots = await captureAnalysisScreenshots(
        page,
        `analysis-${randomUUID()}`,
        screenshotDiagnostics,
      );
      const screenshotCount = Object.values(screenshots).filter(Boolean).length;
      screenshotVariantFailures = screenshotDiagnostics.failures;

      if (screenshotCount > 0) {
        console.info("[analysis] screenshots captured", {
          count: screenshotCount,
          variants: Object.keys(screenshots).filter((key) => Boolean(screenshots?.[key as keyof AnalysisScreenshots])),
        });
        if (screenshotDiagnostics.failures.length > 0) {
          screenshotError = `Some screenshot variants failed: ${screenshotDiagnostics.failures
            .map((entry) => `${entry.variant}: ${entry.reason}`)
            .join("; ")}`;
          screenshotErrorSource = "capture";
        }
      } else {
        if (screenshotDiagnostics.failures.length > 0) {
          screenshotError = `Screenshot capture failed for all variants: ${screenshotDiagnostics.failures
            .map((entry) => `${entry.variant}: ${entry.reason}`)
            .join("; ")}`;
          screenshotErrorSource = "capture";
        } else {
          screenshotError = "Screenshot capture completed, but no screenshot storage URL was returned.";
          screenshotErrorSource = "storage";
        }
        console.warn("[analysis] screenshot capture produced no stored screenshots", {
          reason: screenshotError,
          variantsAttempted: ["viewport", "fullPage", "mobile"],
          variantFailures: screenshotDiagnostics.failures,
          storageMisses: screenshotDiagnostics.storageMisses,
        });
      }
    } catch (error) {
      screenshotError =
        error instanceof Error
          ? error.message
          : "Die visuelle Vorschau konnte nicht erstellt werden.";
      screenshotErrorSource = "capture";
      console.warn("[analysis] screenshot capture skipped because capture failed", {
        reason: screenshotError,
      });
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
      screenshotErrorSource,
      screenshotVariantFailures,
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
