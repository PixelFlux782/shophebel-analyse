import type { Page } from "puppeteer-core";

import { PageRenderSignals } from "@/types/analysis";

export async function collectVisualSignals(page: Page): Promise<PageRenderSignals> {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const bodyText = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    const visibleButtons = Array.from(
      document.querySelectorAll("button,input[type='submit'],input[type='button']"),
    ).filter(isVisible).length;
    const visibleLinks = Array.from(document.querySelectorAll("a[href]")).filter(isVisible)
      .length;
    const formFieldCount = Array.from(
      document.querySelectorAll("input, textarea, select"),
    ).filter(isVisible).length;
    const imageCount = Array.from(document.querySelectorAll("img")).filter(isVisible).length;
    const visibleCtaTextMatches =
      bodyText.match(/\b(kaufen|bestellen|anfragen|starten|testen|angebot|jetzt)\b/gi)?.length ??
      0;
    const stickyHeaderDetected = Array.from(document.querySelectorAll("header, nav, [data-sticky]"))
      .some((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        return style.position === "sticky" || style.position === "fixed";
      });

    return {
      visibleButtons,
      visibleLinks,
      formFieldCount,
      visibleCtaTextMatches,
      imageCount,
      visibleTextLength: bodyText.length,
      stickyHeaderDetected,
    };
  });
}
