import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAnalysisResult, saveAnalysisResult } from "@/lib/analysisStore";
import { AnalysisResult } from "@/types/analysis";

function createAnalysisResult(): AnalysisResult {
  const now = new Date().toISOString();

  return {
    url: "https://shop.test/",
    createdAt: now,
    requestedUrl: "https://shop.test",
    scannedAt: now,
    analysisMode: "static",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    visualPreviewAvailable: false,
    isPremium: false,
    totalFindings: 0,
    visibleFindings: 0,
    overallScore: 80,
    categories: {
      seo: { score: 80, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 80, label: "Performance", summary: "OK", checks: [] },
      trust: { score: 80, label: "Trust", summary: "OK", checks: [] },
      conversion: { score: 80, label: "Conversion", summary: "OK", checks: [] },
      design: { score: 80, label: "Design", summary: "OK", checks: [] },
      aiVisibility: { score: 80, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [],
    measures: [],
    categoryScores: {},
    findings: [],
    recommendations: [],
    aiSuggestions: [],
  };
}

function resetMemoryStore() {
  (
    globalThis as typeof globalThis & {
      __shophebelAnalysisStore?: Map<string, unknown>;
    }
  ).__shophebelAnalysisStore = undefined;
}

describe("analysisStore", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    resetMemoryStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    resetMemoryStore();
  });

  it("speichert Analyse-Ergebnisse im Development im In-Memory-Fallback", async () => {
    const analysis = createAnalysisResult();
    const saved = await saveAnalysisResult({ analysis });

    expect(saved.id).toBeTruthy();
    expect(saved.analysis.url).toBe("https://shop.test/");
  });

  it("liest Analyse-Ergebnisse im Development aus dem In-Memory-Fallback", async () => {
    const analysis = createAnalysisResult();
    const saved = await saveAnalysisResult({ analysis, isDemo: true });
    const loaded = await getAnalysisResult(saved.id);

    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.analysis.requestedUrl).toBe("https://shop.test");
    expect(loaded?.isDemo).toBe(true);
  });

  it("blockt Production ohne Supabase-Konfiguration klar", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(saveAnalysisResult({ analysis: createAnalysisResult() })).rejects.toThrow(
      "Analysis persistence is not configured",
    );
    await expect(getAnalysisResult("missing-id")).rejects.toThrow(
      "Analysis persistence is not configured",
    );
  });
});
