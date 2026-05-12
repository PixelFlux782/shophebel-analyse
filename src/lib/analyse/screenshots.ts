import type { Page } from "puppeteer-core";

import { AnalysisScreenshots } from "@/types/analysis";
import { saveScreenshotBuffer } from "@/lib/analyse/screenshot-storage";

export interface ScreenshotCaptureDiagnostics {
  failures: Array<{
    variant: keyof AnalysisScreenshots;
    reason: string;
  }>;
  storageMisses: Array<{
    variant: keyof AnalysisScreenshots;
  }>;
}

export async function capturePageScreenshot(page: Page, prefix: string) {
  const buffer = await page.screenshot({
    type: "png",
    fullPage: true,
  });

  return saveScreenshotBuffer({
    buffer: buffer as Uint8Array,
    prefix,
    variant: "full",
  });
}

export async function captureViewportScreenshot(page: Page, prefix: string) {
  const buffer = await page.screenshot({
    type: "png",
    fullPage: false,
  });

  return saveScreenshotBuffer({
    buffer: buffer as Uint8Array,
    prefix,
    variant: "viewport",
  });
}

export async function captureHeroScreenshot(page: Page, prefix: string) {
  void page;
  void prefix;

  return undefined;
}

export async function captureMobileScreenshot(page: Page, prefix: string) {
  const currentViewport = page.viewport();

  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    isMobile: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 350));

  const buffer = await page.screenshot({
    type: "png",
    fullPage: false,
  });

  if (currentViewport) {
    await page.setViewport(currentViewport);
  }

  return saveScreenshotBuffer({
    buffer: buffer as Uint8Array,
    prefix,
    variant: "mobile",
  });
}

export async function captureAnalysisScreenshots(
  page: Page,
  prefix: string,
  diagnostics?: ScreenshotCaptureDiagnostics,
): Promise<AnalysisScreenshots> {
  console.info("[analysis] captureAnalysisScreenshots called", {
    prefix,
    variants: ["viewport", "fullPage", "mobile"],
  });

  const captureVariant = async (
    variant: keyof AnalysisScreenshots,
    capture: () => Promise<string | undefined>,
  ) => {
    try {
      const result = await capture();

      if (result) {
        console.info("[analysis] screenshot variant stored", {
          variant,
          url: result,
        });
      } else {
        diagnostics?.storageMisses.push({ variant });
        console.warn("[analysis] screenshot variant returned no storage URL", {
          variant,
        });
      }

      return result;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown";
      diagnostics?.failures.push({
        variant,
        reason,
      });
      console.warn("[analysis] screenshot variant capture failed", {
        variant,
        reason,
      });

      return undefined;
    }
  };

  const viewport = await captureVariant("viewport", () => captureViewportScreenshot(page, prefix));
  const fullPage = await captureVariant("fullPage", () => capturePageScreenshot(page, prefix));
  const mobile = await captureVariant("mobile", () => captureMobileScreenshot(page, prefix));

  return {
    viewport,
    fullPage,
    mobile,
  };
}
