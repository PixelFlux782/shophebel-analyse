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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareScreenshotSurface(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);

    const styleId = "shophebel-screenshot-stability";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }).catch(() => undefined);
  await wait(250);
}

async function captureClippedPng(
  page: Page,
  clip: {
    width: number;
    height: number;
  },
) {
  await prepareScreenshotSurface(page);

  return page.screenshot({
    type: "png",
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: clip.width,
      height: clip.height,
    },
  });
}

async function getDocumentClip(page: Page) {
  return page.evaluate(() => ({
    width: Math.max(
      document.documentElement.clientWidth,
      Math.min(document.documentElement.scrollWidth, 1440),
    ),
    height: Math.max(
      document.documentElement.clientHeight,
      Math.min(document.documentElement.scrollHeight, 2600),
    ),
  }));
}

export async function capturePageScreenshot(page: Page, prefix: string) {
  const clip = await getDocumentClip(page);
  const buffer = await captureClippedPng(page, clip);

  return saveScreenshotBuffer({
    buffer: buffer as Uint8Array,
    prefix,
    variant: "full",
  });
}

export async function captureViewportScreenshot(page: Page, prefix: string) {
  await page.setViewport({
    width: 1365,
    height: 900,
    deviceScaleFactor: 1,
  });

  const buffer = await captureClippedPng(page, {
    width: 1365,
    height: 900,
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

  await wait(350);

  const buffer = await captureClippedPng(page, {
    width: 390,
    height: 844,
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
