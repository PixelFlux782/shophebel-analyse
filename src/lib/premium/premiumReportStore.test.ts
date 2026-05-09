import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { buildPremiumReport } from "@/lib/premium/buildPremiumReport";
import {
  getOrCreatePremiumReport,
  getPremiumReportByAnalysisId,
  getPremiumReportRecordByAnalysisId,
  saveConsultantNotesForAnalysis,
} from "@/lib/premium/premiumReportStore";
import { AnalysisResult } from "@/types/analysis";

vi.mock("@/lib/premium/buildPremiumReport", () => ({
  buildPremiumReport: vi.fn(),
}));

const buildPremiumReportMock = vi.mocked(buildPremiumReport);

function createPremiumReport(overrides: Partial<PremiumReport> = {}): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Report",
      mainReason: "Der CTA ist unklar.",
      firstFocus: "CTA und Trust zuerst.",
      businessRelevance: "Mehr Klarheit kann mehr Anfragen bringen.",
      fastestWin: "Hero CTA schaerfen",
    },
    topRevenueBlockers: [],
    priorityRoadmap: ["1. Hero CTA schaerfen"],
    quickImplementationPlan: [],
    visualAuditNotes: [],
    conversionHypothesis: "Wenn der CTA klarer wird, steigen Anfragen.",
    ...overrides,
  };
}

function createAnalysis(): AnalysisResult {
  const now = "2026-05-08T12:00:00.000Z";

  return {
    url: "https://shop.test/",
    createdAt: now,
    requestedUrl: "https://shop.test",
    scannedAt: now,
    analysisMode: "rendered",
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

function createStoredAnalysis(paymentStatus: string | null = "paid"): StoredAnalysisResult {
  return {
    id: "analysis-123",
    analysis: createAnalysis(),
    createdAt: "2026-05-08T12:00:00.000Z",
    isDemo: false,
    paymentStatus,
    paidAt: paymentStatus === "paid" ? "2026-05-08T12:30:00.000Z" : null,
  };
}

describe("premiumReportStore", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    buildPremiumReportMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("gibt einen vorhandenen Premium-Report zurueck", async () => {
    const report = createPremiumReport();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ report }]), { status: 200 }),
    ));

    const loaded = await getPremiumReportByAnalysisId("analysis-123");

    expect(loaded).toEqual(report);
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
  });

  it("laedt Consultant Notes zusammen mit dem Premium-Report", async () => {
    const report = createPremiumReport();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: "premium-report-123",
        analysis_id: "analysis-123",
        report,
        consultant_notes: {
          executiveComment: "Manuell geprueft.",
          customActionItems: ["CTA testen"],
          internalNotes: "Nicht fuer Kunden",
        },
        status: "refined",
      }]), { status: 200 }),
    ));

    const loaded = await getPremiumReportRecordByAnalysisId("analysis-123");

    expect(loaded?.report).toEqual(report);
    expect(loaded?.consultantNotes.executiveComment).toBe("Manuell geprueft.");
    expect(loaded?.consultantNotes.customActionItems).toEqual(["CTA testen"]);
    expect(loaded?.status).toBe("refined");
  });

  it("speichert Consultant Notes ohne den Report neu zu erzeugen", async () => {
    const report = createPremiumReport();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: "premium-report-123",
        analysis_id: "analysis-123",
        report,
        consultant_notes: {
          executiveComment: "Manuell geprueft.",
          customActionItems: ["CTA testen", "Trust ergaenzen"],
        },
        status: "refined",
      }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const saved = await saveConsultantNotesForAnalysis({
      analysisId: "analysis-123",
      consultantNotes: {
        executiveComment: "Manuell geprueft.",
        customActionItems: ["CTA testen", "Trust ergaenzen"],
        internalNotes: "Nur intern",
      },
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      consultant_notes: { internalNotes: string };
      status: string;
    };

    expect(saved?.status).toBe("refined");
    expect(payload.status).toBe("refined");
    expect(payload.consultant_notes.internalNotes).toBe("Nur intern");
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
  });

  it("erzeugt und speichert einen fehlenden Premium-Report", async () => {
    const report = createPremiumReport();
    buildPremiumReportMock.mockReturnValue(report);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ report }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });

    expect(loaded).toEqual(report);
    expect(buildPremiumReportMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://example.supabase.co/rest/v1/premium_reports");
  });

  it("erzeugt fuer unbezahlte Analysen keinen Report", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({
      analysis: createStoredAnalysis("open"),
    });

    expect(loaded).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
  });

  it("crasht bei Supabase-Fehlern nicht und liefert einen generierten Fallback", async () => {
    const report = createPremiumReport();
    buildPremiumReportMock.mockReturnValue(report);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("select failed", { status: 500 }))
      .mockResolvedValueOnce(new Response("insert failed", { status: 500 })));

    const loaded = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });

    expect(loaded).toEqual(report);
    expect(buildPremiumReportMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it("ruft buildPremiumReport nicht erneut auf, wenn der Report danach gespeichert vorliegt", async () => {
    const report = createPremiumReport();
    buildPremiumReportMock.mockReturnValue(report);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ report }]), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ report }]), { status: 200 })));

    await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });
    const secondLoad = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });

    expect(secondLoad).toEqual(report);
    expect(buildPremiumReportMock).toHaveBeenCalledTimes(1);
  });
});
