import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { getOrGeneratePremiumAiReport, PremiumAiReportRequestError } from "@/lib/ai/premiumAiReportServer";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import type { AnalysisResult } from "@/types/analysis";

const mocks = vi.hoisted(() => ({
  getAnalysisResult: vi.fn(),
  getPremiumAiReportByAnalysisId: vi.fn(),
  savePremiumAiReportForAnalysis: vi.fn(),
}));

vi.mock("@/lib/analysisStore", () => ({
  getAnalysisResult: mocks.getAnalysisResult,
}));

vi.mock("@/lib/ai/premiumAiReportStore", () => ({
  getPremiumAiReportByAnalysisId: mocks.getPremiumAiReportByAnalysisId,
  savePremiumAiReportForAnalysis: mocks.savePremiumAiReportForAnalysis,
}));

function createAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const now = "2026-07-02T12:00:00.000Z";

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
    totalFindings: 1,
    visibleFindings: 1,
    overallScore: 64,
    categories: {
      seo: { score: 80, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 70, label: "Performance", summary: "OK", checks: [] },
      trust: { score: 55, label: "Trust", summary: "Trust fehlt", checks: [] },
      conversion: {
        score: 45,
        label: "Conversion",
        summary: "CTA ist unklar",
        checks: [{ title: "CTA unklar", status: "warning", message: "Der Hauptbutton ist nicht eindeutig." }],
      },
      design: { score: 60, label: "Design", summary: "OK", checks: [] },
      aiVisibility: { score: 50, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [
      {
        problem: "CTA im Hero ist nicht eindeutig",
        whyItCostsCustomers: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        action: "Primaeren CTA klarer formulieren.",
        estimatedEffort: "niedrig",
        estimatedImpact: "hoch",
        priority: 1,
        category: "CTA",
        sourceCheck: "Der Hauptbutton ist nicht eindeutig.",
      },
    ],
    measures: [],
    categoryScores: {},
    findings: [
      {
        category: "conversion",
        status: "warning",
        title: "CTA unklar",
        description: "Der Hauptbutton ist nicht eindeutig.",
        priority: "high",
      },
    ],
    recommendations: [],
    aiSuggestions: [],
    opportunities: [],
    ...overrides,
  };
}

function createStoredAnalysis(overrides: Partial<StoredAnalysisResult> = {}): StoredAnalysisResult {
  return {
    id: "analysis-123",
    analysis: createAnalysisResult(),
    createdAt: "2026-07-02T12:00:00.000Z",
    paymentStatus: "paid",
    accessLevel: "premium",
    paidAt: "2026-07-02T12:05:00.000Z",
    plan: "premium",
    productType: "premium_report",
    isPremium: true,
    stripeSessionId: "cs_test_123",
    ...overrides,
  };
}

function createAiReport(overrides: Partial<PremiumAiReport> = {}): PremiumAiReport {
  return {
    executiveSummary: "Kurzfassung",
    mainDiagnosis: "Diagnose",
    scoreExplanation: "Score-Erklaerung",
    topIssues: [
      {
        title: "CTA im Hero ist nicht eindeutig",
        whyItMatters: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        evidence: ["Der Hauptbutton ist nicht eindeutig."],
        recommendedAction: "Primaeren CTA klarer formulieren.",
        impact: "high",
        effort: "low",
      },
    ],
    actionPlan: [
      {
        step: 1,
        title: "CTA schaerfen",
        description: "Hero-CTA konkret machen.",
        priority: "now",
      },
    ],
    exampleImprovements: {
      heroTextIdeas: ["Klarer Nutzen im ersten Satz"],
      ctaIdeas: ["Analyse anfragen"],
      trustElementIdeas: ["Bewertungen sichtbar machen"],
    },
    disclaimer: "Nur auf Basis der Analyse.",
    ...overrides,
  };
}

function createProvider(report = createAiReport()): PremiumReportProvider {
  return {
    generate: vi.fn().mockResolvedValue(JSON.stringify(report)),
  };
}

describe("getOrGeneratePremiumAiReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAnalysisResult.mockResolvedValue(createStoredAnalysis());
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue(null);
    mocks.savePremiumAiReportForAnalysis.mockImplementation(async (input: { analysisId: string; report: PremiumAiReport }) => ({
      id: "ai-report-123",
      analysisId: input.analysisId,
      report: input.report,
      status: "generated",
    }));
  });

  it("weist fehlende Analyse-ID ab", async () => {
    await expect(getOrGeneratePremiumAiReport({ analysisId: "" })).rejects.toMatchObject({
      code: "missing_analysis_id",
      status: 400,
    });

    expect(mocks.getAnalysisResult).not.toHaveBeenCalled();
  });

  it("weist fehlenden Premium-Zugriff ab, bevor der Provider aufgerufen wird", async () => {
    const provider = createProvider();
    mocks.getAnalysisResult.mockResolvedValue(createStoredAnalysis({
      paymentStatus: "free",
      accessLevel: "premium",
      paidAt: null,
    }));

    await expect(getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    })).rejects.toMatchObject({
      code: "premium_access_required",
      status: 403,
    });

    expect(provider.generate).not.toHaveBeenCalled();
    expect(mocks.getPremiumAiReportByAnalysisId).not.toHaveBeenCalled();
  });

  it("ruft bei gueltigem Premium-Zugriff den Provider auf und speichert getrennt", async () => {
    const provider = createProvider();

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
      providerName: "test-provider",
      model: "test-model",
    });

    expect(result.source).toBe("generated");
    expect(result.report.executiveSummary).toBe("Kurzfassung");
    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(mocks.savePremiumAiReportForAnalysis).toHaveBeenCalledWith({
      analysisId: "analysis-123",
      report: result.report,
      provider: "test-provider",
      model: "test-model",
    });
  });

  it("verwendet vorhandene AI-Reports wieder", async () => {
    const existingReport = createAiReport({ executiveSummary: "Schon vorhanden" });
    const provider = createProvider();
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue({
      id: "ai-report-existing",
      analysisId: "analysis-123",
      report: existingReport,
    });

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("cache");
    expect(result.report.executiveSummary).toBe("Schon vorhanden");
    expect(provider.generate).not.toHaveBeenCalled();
    expect(mocks.savePremiumAiReportForAnalysis).not.toHaveBeenCalled();
  });

  it("bricht bei Store-Lesefehlern vor dem Provider-Aufruf ab", async () => {
    const provider = createProvider();
    mocks.getPremiumAiReportByAnalysisId.mockRejectedValue(new Error("table missing"));

    await expect(getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    })).rejects.toMatchObject({
      code: "storage_error",
      status: 500,
    });

    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("mappt Providerfehler sauber", async () => {
    const provider: PremiumReportProvider = {
      generate: vi.fn().mockRejectedValue(new Error("provider exploded")),
    };

    await expect(getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    })).rejects.toMatchObject({
      code: "provider_error",
      status: 502,
    });
  });

  it("mappt ungueltige KI-Antworten auf invalid_ai_response", async () => {
    const provider: PremiumReportProvider = {
      generate: vi.fn().mockResolvedValue("{\"executiveSummary\":\"fehlt viel\"}"),
    };

    await expect(getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    })).rejects.toMatchObject({
      code: "invalid_ai_response",
      status: 502,
    } satisfies Partial<PremiumAiReportRequestError>);
  });
});
