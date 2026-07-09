import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAnalysisResultMock, getOrCreatePremiumReportMock } = vi.hoisted(() => ({
  getAnalysisResultMock: vi.fn(),
  getOrCreatePremiumReportMock: vi.fn(),
}));

vi.mock("@/lib/analysisStore", () => ({
  getAnalysisResult: getAnalysisResultMock,
}));

vi.mock("@/lib/premium/premiumAccess", () => ({
  canViewPremiumReport: (analysis: { paymentStatus?: string }) =>
    analysis.paymentStatus === "paid",
}));

vi.mock("@/lib/premium/premiumReportStore", () => ({
  getOrCreatePremiumReport: getOrCreatePremiumReportMock,
}));

import { POST } from "./route";

function request(analysisId = "analysis-123") {
  return new Request(
    `http://localhost:3001/api/premium-report/process?analysisId=${analysisId}`,
    { method: "POST" },
  );
}

describe("POST /api/premium-report/process", () => {
  beforeEach(() => {
    getAnalysisResultMock.mockReset();
    getOrCreatePremiumReportMock.mockReset();
  });

  it("wartet auf die Webhook-Freischaltung", async () => {
    getAnalysisResultMock.mockResolvedValue({ id: "analysis-123", paymentStatus: "pending" });

    const response = await POST(request() as never);

    expect(await response.json()).toEqual({ status: "payment_pending" });
    expect(getOrCreatePremiumReportMock).not.toHaveBeenCalled();
  });

  it("meldet einen vorhandenen oder neu erstellten Report als bereit", async () => {
    const analysis = { id: "analysis-123", paymentStatus: "paid" };
    getAnalysisResultMock.mockResolvedValue(analysis);
    getOrCreatePremiumReportMock.mockResolvedValue({ websiteAnalysis: { pages: [] } });

    const response = await POST(request() as never);

    expect(await response.json()).toEqual({ status: "ready" });
    expect(getOrCreatePremiumReportMock).toHaveBeenCalledWith({ analysis });
  });
});
