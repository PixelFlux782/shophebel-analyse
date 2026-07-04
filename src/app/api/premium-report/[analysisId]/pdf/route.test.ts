import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { AnalysisResult } from "@/types/analysis";

const getAnalysisResultMock = vi.hoisted(() => vi.fn());
const getPremiumAiReportByAnalysisIdMock = vi.hoisted(() => vi.fn());
const getPremiumReportRecordByAnalysisIdMock = vi.hoisted(() => vi.fn());
const getOrCreatePremiumReportMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analysisStore", () => ({
  getAnalysisResult: getAnalysisResultMock,
}));

vi.mock("@/lib/ai/premiumAiReportStore", () => ({
  getPremiumAiReportByAnalysisId: getPremiumAiReportByAnalysisIdMock,
}));

vi.mock("@/lib/premium/premiumReportStore", () => ({
  getPremiumReportRecordByAnalysisId: getPremiumReportRecordByAnalysisIdMock,
  getOrCreatePremiumReport: getOrCreatePremiumReportMock,
}));

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

function createPremiumReport(overrides: Partial<PremiumReport> = {}): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Conversion- und Trust-Audit",
      mainReason: "Der CTA ist unklar.",
      firstFocus: "CTA und Trust zuerst.",
      businessRelevance: "Mehr Klarheit kann mehr Anfragen bringen.",
      fastestWin: "Hero CTA schärfen",
    },
    topRevenueBlockers: [
      {
        title: "CTA nicht sichtbar genug",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher erkennen den nächsten Schritt nicht.",
        likelyBusinessImpact: "Mehr Abbrüche im oberen Seitenbereich.",
        recommendedFix: "Primären CTA im sichtbaren Startbereich schärfen.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    priorityRoadmap: ["Primären CTA im sichtbaren Startbereich schärfen."],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Hero und CTA",
        actions: ["CTA sichtbarer machen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Sichtbarer Startbereich",
        note: "Nutzenversprechen und CTA prüfen.",
      },
    ],
    conversionHypothesis: "Wenn der CTA klarer wird, steigen Anfragen.",
    ...overrides,
  };
}

function createAiReport(overrides: Partial<PremiumAiReport> = {}): PremiumAiReport {
  return {
    executiveSummary: "Gespeicherte KI-Kurzfassung",
    mainDiagnosis: "Gespeicherte KI-Diagnose",
    topLevers: [
      {
        title: "CTA schaerfen",
        problem: "Der naechste Schritt ist nicht eindeutig.",
        businessImpact: "Unklarheit kann Anfragen bremsen.",
        recommendation: "Primaeren Button konkretisieren.",
        firstStep: "Button-Text pruefen.",
      },
      {
        title: "Trust frueher zeigen",
        problem: "Vertrauen kommt zu spaet.",
        businessImpact: "Unsicherheit kann Besucher verlieren.",
        recommendation: "Bewertungen im Startbereich zeigen.",
        firstStep: "Zwei Trust-Signale auswaehlen.",
      },
      {
        title: "Mobile Reihenfolge pruefen",
        problem: "Wichtige Signale erscheinen mobil spaet.",
        businessImpact: "Mobile Nutzer muessen mehr suchen.",
        recommendation: "Startbereich mobil verdichten.",
        firstStep: "Mobile Ansicht gegenlesen.",
      },
    ],
    sevenDayPlan: [
      { day: "Tag 1-2", focus: "CTA", tasks: ["Button konkretisieren."] },
      { day: "Tag 3-5", focus: "Trust", tasks: ["Bewertungen platzieren."] },
      { day: "Tag 6-7", focus: "Kontrolle", tasks: ["Mobile Ansicht pruefen."] },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen.",
    ...overrides,
  };
}

function createContext(analysisId = "analysis-123") {
  return {
    params: Promise.resolve({ analysisId }),
  };
}

describe("GET /api/premium-report/[analysisId]/pdf", () => {
  beforeEach(() => {
    getAnalysisResultMock.mockResolvedValue(createStoredAnalysis());
    getPremiumReportRecordByAnalysisIdMock.mockResolvedValue({
      id: "premium-report-123",
      analysisId: "analysis-123",
      paymentId: null,
      report: createPremiumReport(),
      consultantNotes: {},
      status: "generated",
      createdAt: "2026-05-08T12:00:00.000Z",
      updatedAt: "2026-05-08T12:00:00.000Z",
      version: "v1",
    });
    getPremiumAiReportByAnalysisIdMock.mockResolvedValue(null);
    getOrCreatePremiumReportMock.mockResolvedValue(createPremiumReport());
  });

  afterEach(() => {
    vi.doUnmock("@/lib/premium/premiumReportPdf");
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("schuetzt unbezahlte Reports", async () => {
    getAnalysisResultMock.mockResolvedValue(createStoredAnalysis("open"));
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(403);
    expect(payload.error).toContain("freigeschaltet");
    expect(getPremiumReportRecordByAnalysisIdMock).not.toHaveBeenCalled();
    expect(getOrCreatePremiumReportMock).not.toHaveBeenCalled();
  });

  it("gibt für bezahlte Reports ein PDF zurück", async () => {
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("shophebel-premium-report-analysis-123.pdf");
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("erstellt für bezahlte Reports ein PDF, auch wenn premium_reports vorher fehlt", async () => {
    getPremiumReportRecordByAnalysisIdMock.mockResolvedValue(null);
    getOrCreatePremiumReportMock.mockResolvedValue(createPremiumReport());
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
    expect(getOrCreatePremiumReportMock).toHaveBeenCalledWith({
      analysis: expect.objectContaining({ id: "analysis-123" }),
    });
  });

  it("setzt den Content-Type auf application/pdf", async () => {
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());

    expect(response.headers.get("content-type")).toBe("application/pdf");
  });

  it("nutzt den gespeicherten KI-Bericht fuer das PDF", async () => {
    vi.resetModules();
    const renderPremiumReportPdfMock = vi.fn().mockResolvedValue(Buffer.from("%PDF stored-ai"));
    const aiReport = createAiReport();
    getPremiumAiReportByAnalysisIdMock.mockResolvedValue({
      id: "ai-report-123",
      analysisId: "analysis-123",
      report: aiReport,
      status: "generated",
      reportVersion: "premium-ai-report-v2",
      inputHash: "hash-123",
    });
    vi.doMock("@/lib/premium/premiumReportPdf", () => ({
      renderPremiumReportPdf: renderPremiumReportPdfMock,
    }));

    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(body.toString()).toBe("%PDF stored-ai");
    expect(getPremiumAiReportByAnalysisIdMock).toHaveBeenCalledWith("analysis-123");
    expect(renderPremiumReportPdfMock).toHaveBeenCalledWith(expect.objectContaining({
      aiReport,
    }));

    vi.doUnmock("@/lib/premium/premiumReportPdf");
  });

  it("crasht bei fehlenden Report-Feldern nicht", async () => {
    getPremiumReportRecordByAnalysisIdMock.mockResolvedValue({
      id: "premium-report-123",
      analysisId: "analysis-123",
      report: {
        premiumSummary: {
          headline: "Unvollständiger Report",
        },
      },
      consultantNotes: {},
      status: "generated",
    });
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("gibt bei PDF-Renderfehlern keine internen Dateipfade zurück", async () => {
    vi.resetModules();
    vi.doMock("@/lib/premium/premiumReportPdf", () => ({
      renderPremiumReportPdf: vi.fn().mockRejectedValue(
        new Error("ENOENT: no such file or directory, open 'C:\\Users\\flori\\Documents\\SHOPHEBEL\\shophebel-analyse\\.next\\dev\\server\\vendor-chunks\\data\\Helvetica.afm'"),
      ),
    }));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("@/app/api/premium-report/[analysisId]/pdf/route");

    const response = await GET(new Request("http://localhost:3001/api/premium-report/analysis-123/pdf"), createContext());
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "PDF konnte nicht erzeugt werden." });
    expect(payload.error).not.toMatch(/Helvetica\.afm|Users|\.next|ENOENT/);
    expect(consoleErrorSpy).toHaveBeenCalled();

    vi.doUnmock("@/lib/premium/premiumReportPdf");
  });
});
