import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CheckoutSuccessPage from "./page";

describe("CheckoutSuccessPage", () => {
  it("rendert den Link zur Premium-Analyse mit analysisId", async () => {
    const page = await CheckoutSuccessPage({
      searchParams: Promise.resolve({ analysisId: "analysis-456" }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Zahlung erfolgreich");
    expect(markup).toContain("Premium wird freigeschaltet");
    expect(markup).toContain("Zur Premium-Analyse");
    expect(markup).toContain('href="/analyse/result/analysis-456"');
    expect(markup).toContain("Automatische Weiterleitung");
  });

  it("unterstuetzt den alten analysis-Parameter als Fallback", async () => {
    const page = await CheckoutSuccessPage({
      searchParams: Promise.resolve({ analysis: "legacy-analysis" }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('href="/analyse/result/legacy-analysis"');
  });

  it("behandelt eine fehlende analysisId sauber", async () => {
    const page = await CheckoutSuccessPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Analyse-ID fehlt");
    expect(markup).toContain('href="/analyse"');
    expect(markup).not.toContain("Zur Premium-Analyse");
  });
});
