import { describe, expect, it } from "vitest";

import { generateSuggestions } from "@/lib/ai/generate-suggestions";
import { AnalysisResult } from "@/types/analysis";

function createResult(): AnalysisResult {
  return {
    url: "https://shop.test/",
    requestedUrl: "https://shop.test",
    scannedAt: "2026-04-20T20:00:00.000Z",
    analysisMode: "rendered",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    screenshots: {
      fullPage: "/generated-screenshots/test-full.png",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2200,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [{ x: 120, y: 180, width: 220, height: 56, label: "Jetzt starten" }],
      headings: [{ x: 100, y: 80, width: 640, height: 72, label: "Hero Headline" }],
      images: [{ x: 820, y: 140, width: 420, height: 320, label: "Hero Bild" }],
      forms: [],
      links: [{ x: 100, y: 1980, width: 180, height: 24, label: "Impressum" }],
    },
    isPremium: false,
    totalFindings: 2,
    visibleFindings: 2,
    overallScore: 56,
    categoryScores: {
      seo: { category: "seo", label: "SEO", score: 48 },
      trust: { category: "trust", label: "Trust", score: 58 },
      conversion: { category: "conversion", label: "Conversion", score: 52 },
      ux: { category: "ux", label: "UX", score: 66 },
    },
    findings: [
      {
        category: "seo",
        status: "error",
        title: "Meta Description fehlt",
        description: "Es wurde keine Meta Description gefunden.",
        priority: "high",
      },
      {
        category: "conversion",
        status: "warning",
        title: "Keine klare CTA sichtbar",
        description: "Im oberen Bereich ist kein primaerer Call to Action sichtbar.",
        priority: "high",
      },
    ],
    recommendations: [],
    aiSuggestions: [],
  };
}

describe("generateSuggestions", () => {
  it("erzeugt konkrete Vorschlaege aus Findings", async () => {
    const suggestions = await generateSuggestions(createResult());

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]?.expectedImpact).toBe("high");
    expect(suggestions[0]?.linkedFindingKey).toBe("seo:meta description fehlt");
    expect(suggestions[0]?.actionSteps.length).toBeGreaterThan(0);
  });

  it("liefert ohne Findings eine leere Liste", async () => {
    const suggestions = await generateSuggestions({
      ...createResult(),
      findings: [],
      totalFindings: 0,
      visibleFindings: 0,
    });

    expect(suggestions).toEqual([]);
  });
});
