import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";

import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import {
  getOrGeneratePremiumAiReport,
  PREMIUM_AI_REPORT_VERSION,
  resolvePremiumAiRuntimeConfig,
} from "@/lib/ai/premiumAiReportServer";
import { buildPremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider, PremiumReportUsage } from "@/lib/ai/premiumReportProvider";
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
    mainDiagnosis: "Das eigentliche Problem ist nicht der Button allein, sondern die unklare Entscheidungshilfe.",
    topLevers: [
      {
        title: "CTA im Hero ist nicht eindeutig",
        whyItMatters: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        shopObservation: "Unklare Fuehrung kann Anfragen bremsen.",
        improvement: "Primaeren CTA klarer formulieren.",
        firstStep: "CTA-Text pruefen.",
        difficulty: "leicht",
        expectedEffect: "Qualitativ: klarere Fuehrung bis zur Anfrage.",
      },
      {
        title: "Vertrauen fehlt frueh",
        whyItMatters: "Vertrauenssignale sind nicht frueh genug sichtbar.",
        shopObservation: "Unsicherheit kann Kaufentscheidungen verzoegern.",
        improvement: "Bewertungen naeher an den Startbereich bringen.",
        firstStep: "Zwei Trust-Signale auswaehlen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: mehr Sicherheit vor der Entscheidung.",
      },
      {
        title: "Mobile Reihenfolge pruefen",
        whyItMatters: "Wichtige Signale koennen mobil zu spaet kommen.",
        shopObservation: "Mobile Besucher muessen mehr suchen.",
        improvement: "Startbereich mobil verdichten.",
        firstStep: "Mobile Ansicht gegenlesen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: schnelleres Verstehen auf kleinen Bildschirmen.",
      },
    ],
    sevenDayPlan: [
      {
        day: "Tag 1-2",
        focus: "Klarheit schaffen: Texte und wichtigste Handlung",
        tasks: ["Hero-CTA konkret machen."],
      },
      {
        day: "Tag 3-5",
        focus: "Umsetzung an Startseite, Produktseite, Vertrauen und Navigation",
        tasks: ["Trust-Signale platzieren."],
      },
      {
        day: "Tag 6-7",
        focus: "Kontrolle, Vergleich und naechste Optimierung",
        tasks: ["Mobile Ansicht pruefen."],
      },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen, dann naechster Schritt.",
    ...overrides,
  };
}

function createProvider(report = createAiReport(), usage?: PremiumReportUsage): PremiumReportProvider {
  return {
    generate: vi.fn().mockResolvedValue(usage ? { content: JSON.stringify(report), usage } : JSON.stringify(report)),
  };
}

function currentInputHash(analysis = createAnalysisResult()) {
  return createHash("sha256").update(JSON.stringify(buildPremiumReportInput(analysis))).digest("hex");
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("getOrGeneratePremiumAiReport", () => {
  const originalEnv = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_ENABLED: process.env.AI_ENABLED,
    ALLOW_AI_REGENERATE: process.env.ALLOW_AI_REGENERATE,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    restoreEnv("AI_PROVIDER", originalEnv.AI_PROVIDER);
    restoreEnv("AI_ENABLED", originalEnv.AI_ENABLED);
    restoreEnv("ALLOW_AI_REGENERATE", originalEnv.ALLOW_AI_REGENERATE);
    restoreEnv("OPENROUTER_API_KEY", originalEnv.OPENROUTER_API_KEY);
    restoreEnv("OPENROUTER_MODEL", originalEnv.OPENROUTER_MODEL);
    mocks.getAnalysisResult.mockResolvedValue(createStoredAnalysis());
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue(null);
    mocks.savePremiumAiReportForAnalysis.mockImplementation(async (input: { analysisId: string; report: PremiumAiReport }) => ({
      id: "ai-report-123",
      analysisId: input.analysisId,
      report: input.report,
      status: "generated",
    }));
  });

  it("nutzt ohne Env-Konfiguration den kostenfreien Mock-Provider", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENROUTER_API_KEY;

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
    });

    expect(result.source).toBe("generated");
    expect(result.report.topLevers).toHaveLength(3);
    expect(mocks.savePremiumAiReportForAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      provider: "mock",
      model: "shophebel-mock-premium-ai-report",
      status: "generated",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      totalTokens: expect.any(Number),
      usageEstimated: true,
    }));
  });

  it("speichert echte Provider-Usage, wenn sie vorhanden ist", async () => {
    const provider = createProvider(createAiReport(), {
      promptTokens: 111,
      completionTokens: 222,
      totalTokens: 333,
      estimatedCost: 0.0005,
      isEstimated: false,
    });

    await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
      providerName: "openrouter",
      model: "openrouter/test-model",
    });

    expect(mocks.savePremiumAiReportForAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      promptTokens: 111,
      completionTokens: 222,
      totalTokens: 333,
      estimatedCost: 0.0005,
      usageEstimated: false,
    }));
  });

  it("loest bei AI_ENABLED=false keinen Provider-Aufruf aus und speichert einen Fallback", async () => {
    process.env.AI_ENABLED = "false";
    const provider = createProvider();

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("fallback");
    expect(provider.generate).not.toHaveBeenCalled();
    expect(mocks.savePremiumAiReportForAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      provider: "fallback",
      status: "fallback",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
    }));
  });

  it("liest die Runtime-Schalter defensiv aus der Env", () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.AI_ENABLED = "0";
    process.env.ALLOW_AI_REGENERATE = "yes";
    process.env.OPENROUTER_MODEL = "openrouter/test-model";

    expect(resolvePremiumAiRuntimeConfig()).toEqual({
      enabled: false,
      providerName: "openrouter",
      model: "openrouter/test-model",
      allowRegenerate: true,
    });
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
      status: "generated",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash: expect.any(String),
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      estimatedCost: null,
      usageEstimated: null,
    });
  });

  it("verwendet vorhandene AI-Reports wieder", async () => {
    const existingReport = createAiReport({ executiveSummary: "Schon vorhanden" });
    const provider = createProvider();
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue({
      id: "ai-report-existing",
      analysisId: "analysis-123",
      report: existingReport,
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash: currentInputHash(),
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

  it("regeneriert alte Report-Versionen", async () => {
    const provider = createProvider(createAiReport({ executiveSummary: "Neu erzeugt" }));
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue({
      id: "ai-report-existing",
      analysisId: "analysis-123",
      report: createAiReport({ executiveSummary: "Alter Bericht" }),
      reportVersion: "premium-ai-report-v2",
      inputHash: currentInputHash(),
      status: "generated",
    });

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("generated");
    expect(result.report.executiveSummary).toBe("Neu erzeugt");
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });

  it("regeneriert geaenderte Inputs nur mit ALLOW_AI_REGENERATE=true", async () => {
    process.env.ALLOW_AI_REGENERATE = "true";
    const provider = createProvider(createAiReport({ executiveSummary: "Neu erzeugt" }));
    mocks.getPremiumAiReportByAnalysisId.mockResolvedValue({
      id: "ai-report-existing",
      analysisId: "analysis-123",
      report: createAiReport({ executiveSummary: "Alter Bericht" }),
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash: "alter-hash",
      status: "generated",
    });

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("generated");
    expect(result.report.executiveSummary).toBe("Neu erzeugt");
    expect(provider.generate).toHaveBeenCalledTimes(1);
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

  it("nutzt bei Providerfehlern einen gespeicherten Fallback", async () => {
    const provider: PremiumReportProvider = {
      generate: vi.fn().mockRejectedValue(new Error("provider exploded")),
    };

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("fallback");
    expect(result.report.topLevers).toHaveLength(3);
    expect(mocks.savePremiumAiReportForAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      analysisId: "analysis-123",
      status: "fallback",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash: expect.any(String),
    }));
  });

  it("nutzt bei ungueltigen KI-Antworten einen gespeicherten Fallback", async () => {
    const provider: PremiumReportProvider = {
      generate: vi.fn().mockResolvedValue("{\"executiveSummary\":\"fehlt viel\"}"),
    };

    const result = await getOrGeneratePremiumAiReport({
      analysisId: "analysis-123",
      provider,
    });

    expect(result.source).toBe("fallback");
    expect(result.report.sevenDayPlan).toHaveLength(3);
  });
});
