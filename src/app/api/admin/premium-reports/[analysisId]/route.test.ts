import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAnalysisResultMock = vi.hoisted(() => vi.fn());
const getPremiumReportRecordByAnalysisIdMock = vi.hoisted(() => vi.fn());
const saveConsultantNotesForAnalysisMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analysisStore", () => ({
  getAnalysisResult: getAnalysisResultMock,
}));

vi.mock("@/lib/premium/premiumReportStore", () => ({
  getPremiumReportRecordByAnalysisId: getPremiumReportRecordByAnalysisIdMock,
  saveConsultantNotesForAnalysis: saveConsultantNotesForAnalysisMock,
}));

const analysis = {
  id: "analysis-123",
  analysis: { url: "https://shop.test/" },
  createdAt: "2026-05-08T12:00:00.000Z",
  paymentStatus: "paid",
};

const premiumReport = {
  id: "premium-report-123",
  analysisId: "analysis-123",
  report: { isPaid: true },
  consultantNotes: {
    executiveComment: "Manuell geprueft.",
  },
  status: "refined",
};

function createContext() {
  return {
    params: Promise.resolve({ analysisId: "analysis-123" }),
  };
}

function createAdminRequest(method: "GET" | "PATCH", body?: unknown) {
  return new Request("http://localhost:3001/api/admin/premium-reports/analysis-123", {
    method,
    headers: {
      authorization: "Bearer admin-secret",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/admin/premium-reports/[analysisId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_API_TOKEN", "admin-secret");
    getAnalysisResultMock.mockResolvedValue(analysis);
    getPremiumReportRecordByAnalysisIdMock.mockResolvedValue(premiumReport);
    saveConsultantNotesForAnalysisMock.mockResolvedValue({
      ...premiumReport,
      consultantNotes: {
        executiveComment: "Neu geprueft.",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("laedt Premium-Report und Consultant Notes fuer Admins", async () => {
    const { GET } = await import("@/app/api/admin/premium-reports/[analysisId]/route");

    const response = await GET(createAdminRequest("GET"), createContext());
    const payload = await response.json() as {
      premiumReport: { consultantNotes: { executiveComment: string } };
    };

    expect(response.status).toBe(200);
    expect(payload.premiumReport.consultantNotes).toEqual({
      executiveComment: "Manuell geprueft.",
    });
  });

  it("speichert Consultant Notes fuer Admins", async () => {
    const { PATCH } = await import("@/app/api/admin/premium-reports/[analysisId]/route");

    const response = await PATCH(createAdminRequest("PATCH", {
      consultantNotes: {
        executiveComment: "Neu geprueft.",
        customActionItems: "CTA testen\nTrust ergaenzen",
        internalNotes: "Nur intern",
      },
    }), createContext());
    const payload = await response.json() as { premiumReport: { consultantNotes: { executiveComment: string } } };

    expect(response.status).toBe(200);
    expect(saveConsultantNotesForAnalysisMock).toHaveBeenCalledWith({
      analysisId: "analysis-123",
      consultantNotes: {
        executiveComment: "Neu geprueft.",
        priorityOverrideNotes: "",
        customActionItems: ["CTA testen", "Trust ergaenzen"],
        upsellRecommendation: "",
        internalNotes: "Nur intern",
      },
    });
    expect(payload.premiumReport.consultantNotes.executiveComment).toBe("Neu geprueft.");
  });

  it("blockt Admin-Zugriff ohne Token", async () => {
    const { GET } = await import("@/app/api/admin/premium-reports/[analysisId]/route");

    const response = await GET(new Request("http://localhost:3001/api/admin/premium-reports/analysis-123"), createContext());

    expect(response.status).toBe(401);
    expect(getAnalysisResultMock).not.toHaveBeenCalled();
  });
});
