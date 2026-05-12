import { describe, expect, it } from "vitest";

import { buildAnalysisResult, calculateOverallScore, createCategoryScore } from "@/lib/analyse/scoring";

describe("analysis scoring", () => {
  it("berechnet den Gesamt-Score als gerundeten Mittelwert", () => {
    const overallScore = calculateOverallScore({
      seo: createCategoryScore("seo", 80),
      trust: createCategoryScore("trust", 70),
      conversion: createCategoryScore("conversion", 60),
      ux: createCategoryScore("ux", 50),
    });

    expect(overallScore).toBe(65);
  });

  it("setzt Free-Metadaten fuer Findings im AnalysisResult", () => {
    const result = buildAnalysisResult({
      requestedUrl: "https://shop.test",
      finalUrl: "https://shop.test/",
      analysisMode: "static",
      technicalNotes: ["Seite wurde per statischem HTML analysiert."],
      categoryScores: {
        seo: createCategoryScore("seo", 80),
        trust: createCategoryScore("trust", 70),
        conversion: createCategoryScore("conversion", 60),
        ux: createCategoryScore("ux", 50),
      },
      findings: Array.from({ length: 8 }, (_, index) => ({
        category: "seo" as const,
        status: "warning" as const,
        title: `Finding ${index + 1}`,
        description: "Beschreibung",
        priority: "medium" as const,
      })),
      recommendations: [],
    });

    expect(result.isPremium).toBe(false);
    expect(result.analysisMode).toBe("static");
    expect(result.finalUrl).toBe("https://shop.test/");
    expect(result.technicalNotes).toHaveLength(1);
    expect(result.totalFindings).toBe(8);
    expect(result.visibleFindings).toBe(5);
    expect(result.overallScore).toBe(65);
    expect(result.aiSuggestions).toEqual([]);
  });

  it("setzt visualPreviewAvailable auch fuer mobile-only Screenshots", () => {
    const result = buildAnalysisResult({
      requestedUrl: "https://shop.test",
      finalUrl: "https://shop.test/",
      analysisMode: "rendered",
      screenshots: {
        mobile: "https://example.supabase.co/storage/v1/object/public/screenshots/mobile.png",
      },
      categoryScores: {
        seo: createCategoryScore("seo", 80),
      },
      findings: [],
      recommendations: [],
    });

    expect(result.screenshots?.mobile).toContain("mobile.png");
    expect(result.visualPreviewAvailable).toBe(true);
  });

  it("entfernt leere Screenshot-Objekte aus dem AnalysisResult", () => {
    const result = buildAnalysisResult({
      requestedUrl: "https://shop.test",
      finalUrl: "https://shop.test/",
      analysisMode: "rendered",
      screenshots: {},
      categoryScores: {
        seo: createCategoryScore("seo", 80),
      },
      findings: [],
      recommendations: [],
    });

    expect(result.screenshots).toBeUndefined();
    expect(result.visualPreviewAvailable).toBe(false);
  });
});
