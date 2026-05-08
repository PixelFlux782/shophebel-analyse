import { load } from "cheerio";

export interface ContentQualityMetrics {
  htmlLength: number;
  bodyTextLength: number;
  headingCount: number;
  linkCount: number;
  buttonCount: number;
  bodyChildCount: number;
  rootOnlyShell: boolean;
  scriptCount: number;
}

export function getContentQualityMetrics(html: string): ContentQualityMetrics {
  const $ = load(html);
  const body = $("body");
  const bodyText = body.text().replace(/\s+/g, " ").trim();
  const bodyChildren = body.children();
  const rootLikeContainers = bodyChildren.filter((_, element) => {
    const id = ($(element).attr("id") ?? "").toLowerCase();
    const className = ($(element).attr("class") ?? "").toLowerCase();
    return /(root|app|next|container|mount)/.test(`${id} ${className}`);
  }).length;

  return {
    htmlLength: html.length,
    bodyTextLength: bodyText.length,
    headingCount: $("h1, h2, h3").length,
    linkCount: $("a[href]").length,
    buttonCount: $("button, input[type='submit'], input[type='button']").length,
    bodyChildCount: bodyChildren.length,
    rootOnlyShell:
      bodyChildren.length <= 2 &&
      rootLikeContainers > 0 &&
      bodyText.length < 240,
    scriptCount: $("script").length,
  };
}

export function isThinHtml(html: string): boolean {
  const metrics = getContentQualityMetrics(html);

  return (
    metrics.htmlLength < 2500 ||
    metrics.bodyTextLength < 220 ||
    (metrics.headingCount === 0 && metrics.linkCount < 3) ||
    (metrics.buttonCount === 0 && metrics.linkCount < 2) ||
    metrics.rootOnlyShell
  );
}

export function shouldUseRenderedFallback(input: {
  html?: string;
  staticFetchFailed?: boolean;
}) {
  if (input.staticFetchFailed) {
    return true;
  }

  if (!input.html) {
    return true;
  }

  return isThinHtml(input.html);
}
