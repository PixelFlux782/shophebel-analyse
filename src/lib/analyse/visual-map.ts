import type { Page } from "puppeteer-core";

import { ElementBox, VisualMap } from "@/types/analysis";

const MAX_ELEMENTS_PER_GROUP = 24;

function trimLabel(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= 72) {
    return normalized;
  }

  return `${normalized.slice(0, 69).trimEnd()}...`;
}

async function collectElementBoxes(
  page: Page,
  selector: string,
  maxItems: number = MAX_ELEMENTS_PER_GROUP,
): Promise<ElementBox[]> {
  return page.$$eval(
    selector,
    (elements, limit) => {
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

      return elements
        .filter(isVisible)
        .slice(0, limit)
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const rect = htmlElement.getBoundingClientRect();
          const label =
            htmlElement.innerText?.replace(/\s+/g, " ").trim() ||
            htmlElement.getAttribute("aria-label") ||
            htmlElement.getAttribute("alt") ||
            htmlElement.getAttribute("placeholder") ||
            htmlElement.getAttribute("title") ||
            "";

          return {
            x: Math.max(0, rect.left + window.scrollX),
            y: Math.max(0, rect.top + window.scrollY),
            width: Math.max(0, rect.width),
            height: Math.max(0, rect.height),
            label,
          };
        });
    },
    maxItems,
  );
}

export async function collectVisualMap(page: Page): Promise<VisualMap> {
  const [pageMetrics, buttons, headings, images, forms, links] = await Promise.all([
    page.evaluate(() => ({
      pageWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0,
        window.innerWidth,
      ),
      pageHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
        window.innerHeight,
      ),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    })),
    collectElementBoxes(page, "button, input[type='submit'], input[type='button']"),
    collectElementBoxes(page, "h1, h2"),
    collectElementBoxes(page, "img"),
    collectElementBoxes(page, "form, [role='form']"),
    collectElementBoxes(page, "a[href]"),
  ]);

  return {
    ...pageMetrics,
    buttons: buttons.map((box) => ({
      ...box,
      label: box.label ? trimLabel(box.label) : undefined,
    })),
    headings: headings.map((box) => ({
      ...box,
      label: box.label ? trimLabel(box.label) : undefined,
    })),
    images: images.map((box) => ({
      ...box,
      label: box.label ? trimLabel(box.label) : undefined,
    })),
    forms: forms.map((box) => ({
      ...box,
      label: box.label ? trimLabel(box.label) : undefined,
    })),
    links: links.map((box) => ({
      ...box,
      label: box.label ? trimLabel(box.label) : undefined,
    })),
  };
}
