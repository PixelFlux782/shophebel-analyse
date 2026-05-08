import { Page } from "puppeteer";

import { AnalysisScreenshots } from "@/types/analysis";
import { saveScreenshotBuffer } from "@/lib/analyse/screenshot-storage";

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
): Promise<AnalysisScreenshots> {
  const viewport = await captureViewportScreenshot(page, prefix);
  const fullPage = await capturePageScreenshot(page, prefix);
  const mobile = await captureMobileScreenshot(page, prefix);

  return {
    viewport,
    fullPage,
    mobile,
  };
}
