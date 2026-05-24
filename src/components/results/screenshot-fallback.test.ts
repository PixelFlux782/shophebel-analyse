import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResultScreenshotTeaser } from "@/components/results/result-screenshot-teaser";

describe("screenshot fallbacks", () => {
  it("zeigt den sauberen Fallback, wenn ein Teaser-Bild fehlschlaegt", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResultScreenshotTeaser, {
        src: "/generated-screenshots/missing.png",
        initialFailed: true,
      }),
    );

    expect(html).toContain("Screenshot nicht geladen");
    expect(html).toContain(
      "Die Analyse ist vorhanden, aber die visuelle Vorschau konnte nicht angezeigt werden.",
    );
    expect(html).not.toContain("<img");
  });
});
