import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { buildPremiumReport } from "@/lib/premium/buildPremiumReport";
import { createPremiumWebsiteAnalysis } from "@/lib/premium/premiumWebsiteAnalysis";
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
vi.mock("@/lib/premium/premiumWebsiteAnalysis", () => ({
  createPremiumWebsiteAnalysis: vi.fn(),
}));

const buildPremiumReportMock = vi.mocked(buildPremiumReport);
const createPremiumWebsiteAnalysisMock = vi.mocked(createPremiumWebsiteAnalysis);

function createPremiumReport(overrides: Partial<PremiumReport> = {}): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Report",
      mainReason: "Der CTA ist unklar.",
      firstFocus: "CTA und Trust zuerst.",
      businessRelevance: "Mehr Klarheit kann mehr Anfragen bringen.",
      fastestWin: "Hero CTA schärfen",
    },
    topRevenueBlockers: [],
    priorityRoadmap: ["1. Hero CTA schärfen"],
    quickImplementationPlan: [],
    visualAuditNotes: [],
    conversionHypothesis: "Wenn der CTA klarer wird, steigen Anfragen.",
    ...overrides,
  };
}

function createWebsiteAnalysis(overrides: Partial<NonNullable<PremiumReport["websiteAnalysis"]>> = {}): NonNullable<PremiumReport["websiteAnalysis"]> {
  return {
    pages: [
      {
        url: "https://shop.test/",
        label: "Startseite",
        role: "home",
        reason: "Startpunkt",
        analysisStatus: "analyzed",
        screenshotUrl: "https://cdn.example.com/home.png",
        score: 80,
        strengths: [],
        problems: [],
        recommendation: "CTA pruefen.",
        shortDiagnosis: "Startseite mit CTA-Hebel.",
      },
      {
        url: "https://shop.test/kontakt",
        label: "Kontakt",
        role: "contact",
        reason: "Kontakt",
        analysisStatus: "analyzed",
        screenshotUnavailableReason: "Screenshot konnte nicht erstellt werden.",
        score: 74,
        strengths: [],
        problems: [],
        recommendation: "Trust pruefen.",
        shortDiagnosis: "Kontakt mit Trust-Hebel.",
      },
    ],
    overallWebsiteScore: 77,
    crossPageDiagnosis: "Website-Systemanalyse",
    repeatedProblems: [],
    conversionPathAssessment: "Conversion-Pfad",
    trustConsistencyAssessment: "Trust",
    navigationAssessment: "Navigation",
    topPrioritiesWebsiteWide: ["Prioritaet"],
    sevenDayPlan: [],
    missingPageTypes: [],
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

function createStoredAnalysis(
  paymentStatus: string | null = "paid",
  overrides: Partial<StoredAnalysisResult> = {},
): StoredAnalysisResult {
  return {
    id: "analysis-123",
    analysis: createAnalysis(),
    createdAt: "2026-05-08T12:00:00.000Z",
    isDemo: false,
    paymentStatus,
    paidAt: paymentStatus === "paid" ? "2026-05-08T12:30:00.000Z" : null,
    ...overrides,
  };
}

describe("premiumReportStore", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubEnv("SUPABASE_SCREENSHOT_BUCKET", "screenshots");
    buildPremiumReportMock.mockReset();
    createPremiumWebsiteAnalysisMock.mockReset();
    createPremiumWebsiteAnalysisMock.mockResolvedValue({
      pages: [],
      overallWebsiteScore: 80,
      crossPageDiagnosis: "Website-Systemanalyse",
      repeatedProblems: [],
      conversionPathAssessment: "Conversion-Pfad",
      trustConsistencyAssessment: "Trust",
      navigationAssessment: "Navigation",
      topPrioritiesWebsiteWide: ["Priorität"],
      sevenDayPlan: [],
      missingPageTypes: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("gibt einen vorhandenen Premium-Report zurück", async () => {
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
          executiveComment: "Manuell geprüft.",
          customActionItems: ["CTA testen"],
          internalNotes: "Nicht für Kunden",
        },
        status: "refined",
      }]), { status: 200 }),
    ));

    const loaded = await getPremiumReportRecordByAnalysisId("analysis-123");

    expect(loaded?.report).toEqual(report);
    expect(loaded?.consultantNotes.executiveComment).toBe("Manuell geprüft.");
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
          executiveComment: "Manuell geprüft.",
          customActionItems: ["CTA testen", "Trust ergänzen"],
        },
        status: "refined",
      }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const saved = await saveConsultantNotesForAnalysis({
      analysisId: "analysis-123",
      consultantNotes: {
        executiveComment: "Manuell geprüft.",
        customActionItems: ["CTA testen", "Trust ergänzen"],
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
    expect(createPremiumWebsiteAnalysisMock).toHaveBeenCalledTimes(1);
    expect(buildPremiumReportMock).toHaveBeenCalledWith(expect.objectContaining({
      websiteAnalysis: expect.objectContaining({
        overallWebsiteScore: 80,
      }),
    }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://example.supabase.co/rest/v1/premium_reports");
  });

  it("erzeugt für unbezahlte Analysen keinen Report", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({
      analysis: createStoredAnalysis("open"),
    });

    expect(loaded).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
    expect(createPremiumWebsiteAnalysisMock).not.toHaveBeenCalled();
  });

  it("erzeugt fuer bezahlte Full-Analysen keine Premium-Mehrseitenanalyse", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({
      analysis: createStoredAnalysis("paid", {
        accessLevel: "full",
        plan: "full",
        productType: "full_analysis",
        isPremium: false,
      }),
    });

    expect(loaded).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
    expect(createPremiumWebsiteAnalysisMock).not.toHaveBeenCalled();
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
    const report = createPremiumReport({ websiteAnalysis: createWebsiteAnalysis() });
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

  it("liefert gespeicherte Unterseiten-Screenshots aus einem privaten Bucket als Signed URL", async () => {
    const storedUrl =
      "https://example.supabase.co/storage/v1/object/public/screenshots/analysis-results/subpage/viewport.png";
    const report = createPremiumReport({
      websiteAnalysis: createWebsiteAnalysis({
        pages: [
          {
            ...createWebsiteAnalysis().pages[1],
            screenshot: storedUrl,
            screenshotUrl: storedUrl,
            screenshotUnavailableReason: undefined,
          },
        ],
      }),
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: "premium-report-123",
        analysis_id: "analysis-123",
        report,
        consultant_notes: {},
        status: "generated",
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        report: {
          ...report,
          websiteAnalysis: {
            ...report.websiteAnalysis!,
            pages: [{
              ...report.websiteAnalysis!.pages[0],
              screenshot: undefined,
              screenshotUrl: undefined,
              screenshotStoragePath: "analysis-results/subpage/viewport.png",
            }],
          },
        },
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        signedURL: "/object/sign/screenshots/analysis-results/subpage/viewport.png?token=signed",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });

    expect(loaded?.websiteAnalysis?.pages[0].screenshotUrl).toBe(
      "https://example.supabase.co/storage/v1/object/sign/screenshots/analysis-results/subpage/viewport.png?token=signed",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://example.supabase.co/storage/v1/object/sign/screenshots/analysis-results/subpage/viewport.png",
    );
    const [, canonicalUpdate] = fetchMock.mock.calls[1] as [string, RequestInit];
    const canonicalPayload = JSON.parse(canonicalUpdate.body as string) as { report: PremiumReport };
    expect(canonicalPayload.report.websiteAnalysis?.pages[0]).toMatchObject({
      screenshotStoragePath: "analysis-results/subpage/viewport.png",
    });
    expect(canonicalPayload.report.websiteAnalysis?.pages[0].screenshotUrl).toBeUndefined();
    expect(buildPremiumReportMock).not.toHaveBeenCalled();
  });

  it("signiert abgelaufene Signed URLs aus alten Reports über ihren kanonischen Storage-Pfad neu", async () => {
    const expiredUrl =
      "https://example.supabase.co/storage/v1/object/sign/screenshots/analysis-results/subpage/viewport.png?token=expired";
    const report = createPremiumReport({
      websiteAnalysis: createWebsiteAnalysis({
        pages: [{
          ...createWebsiteAnalysis().pages[1],
          screenshotUrl: expiredUrl,
          screenshotUnavailableReason: undefined,
        }],
      }),
    });
    const canonicalReport = {
      ...report,
      websiteAnalysis: {
        ...report.websiteAnalysis!,
        pages: [{
          ...report.websiteAnalysis!.pages[0],
          screenshotUrl: undefined,
          screenshotStoragePath: "analysis-results/subpage/viewport.png",
        }],
      },
    };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: "premium-report-123",
        analysis_id: "analysis-123",
        report,
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ report: canonicalReport }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        signedURL: "/object/sign/screenshots/analysis-results/subpage/viewport.png?token=fresh",
      }), { status: 200 })));

    const loaded = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });

    expect(loaded?.websiteAnalysis?.pages[0].screenshotUrl).toContain("token=fresh");
    expect(createPremiumWebsiteAnalysisMock).not.toHaveBeenCalled();
  });

  it("regeneriert alte gespeicherte Premium-Reports ohne Unterseiten-Screenshot-Entscheidung", async () => {
    const staleReport = createPremiumReport({
      websiteAnalysis: createWebsiteAnalysis({
        pages: [
          {
            url: "https://shop.test/kontakt",
            label: "Kontakt",
            role: "contact",
            reason: "Kontakt",
            analysisStatus: "analyzed",
            score: 74,
            strengths: [],
            problems: [],
            recommendation: "Trust pruefen.",
            shortDiagnosis: "Kontakt mit Trust-Hebel.",
          },
        ],
      }),
    });
    const refreshedReport = createPremiumReport({
      websiteAnalysis: createWebsiteAnalysis({
        pages: [
          {
            url: "https://shop.test/kontakt",
            label: "Kontakt",
            role: "contact",
            reason: "Kontakt",
            analysisStatus: "analyzed",
            screenshotUrl: "https://cdn.example.com/kontakt.png",
            score: 74,
            strengths: [],
            problems: [],
            recommendation: "Trust pruefen.",
            shortDiagnosis: "Kontakt mit Trust-Hebel.",
          },
        ],
      }),
    });
    buildPremiumReportMock.mockReturnValue(refreshedReport);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: "premium-report-123",
        analysis_id: "analysis-123",
        report: staleReport,
        consultant_notes: {},
        status: "generated",
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ report: refreshedReport }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getOrCreatePremiumReport({ analysis: createStoredAnalysis() });
    const [, updateInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const payload = JSON.parse(updateInit.body as string) as { report: PremiumReport };

    expect(loaded).toEqual(refreshedReport);
    expect(createPremiumWebsiteAnalysisMock).toHaveBeenCalledTimes(1);
    expect(buildPremiumReportMock).toHaveBeenCalledTimes(1);
    expect(updateInit.method).toBe("PATCH");
    expect(payload.report.websiteAnalysis?.pages[0].screenshotUrl).toBe("https://cdn.example.com/kontakt.png");
  });
});
