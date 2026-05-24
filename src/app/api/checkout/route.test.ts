import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createMockSession, getAnalysisResultMock, markAnalysisPendingMock } = vi.hoisted(() => ({
  createMockSession: vi.fn(),
  getAnalysisResultMock: vi.fn(),
  markAnalysisPendingMock: vi.fn(),
}));

vi.mock("stripe", () => {
  return {
    default: class Stripe {
      checkout = {
        sessions: {
          create: createMockSession,
        },
      };
    },
  };
});

vi.mock("@/lib/analysisStore", () => ({
  getAnalysisResult: getAnalysisResultMock,
  markAnalysisPending: markAnalysisPendingMock,
}));

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3001/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.STRIPE_FULL_ANALYSIS_PRICE_ID;
    delete process.env.STRIPE_PREMIUM_ANALYSIS_PRICE_ID;
    createMockSession.mockReset();
    getAnalysisResultMock.mockReset();
    markAnalysisPendingMock.mockReset();
    markAnalysisPendingMock.mockResolvedValue(undefined);
    getAnalysisResultMock.mockResolvedValue({
      id: "analysis-123",
      analysis: { url: "https://shop.test" },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("gibt in Production ohne Stripe-Konfiguration einen Fehler zurück", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({ analysisId: "analysis-123" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(payload.error).toContain("Stripe Checkout");
    expect(createMockSession).not.toHaveBeenCalled();
  });

  it("liefert in Development ohne Stripe-Konfiguration einen Demo-Fallback ohne Success-Link", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({ analysisId: "analysis-123" }));
    const payload = (await response.json()) as { url: string; demo: boolean };

    expect(response.status).toBe(200);
    expect(payload.demo).toBe(true);
    expect(payload.url).toContain("/analyse/result/analysis-123?checkout=demo&upgrade=premium");
    expect(payload.url).not.toContain("/checkout/success");
    expect(createMockSession).not.toHaveBeenCalled();
  });

  it("gibt bei fehlender analysisId einen 400-Fehler zurück", async () => {
    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({}));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Analyse-ID");
  });

  it("erstellt mit Stripe-Konfiguration eine Checkout-Session", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PREMIUM_ANALYSIS_PRICE_ID = "price_premium_123";
    createMockSession.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/test-session",
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({
      analysisId: "analysis-456",
      productType: "premium_report",
      plan: "premium",
    }));
    const payload = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(createMockSession).toHaveBeenCalledOnce();
    expect(createMockSession).toHaveBeenCalledWith(expect.objectContaining({
      success_url: expect.stringContaining(
        "/analyse/result/analysis-456?upgrade=premium&success=true",
      ),
      cancel_url: expect.stringContaining("/analyse/result/analysis-456"),
      line_items: [
        {
          price: "price_premium_123",
          quantity: 1,
        },
      ],
      metadata: {
        analysisId: "analysis-456",
        productType: "premium_report",
        accessLevel: "premium",
        plan: "premium",
      },
    }));
    expect(payload.url).toBe("https://checkout.stripe.com/pay/test-session");
    expect(markAnalysisPendingMock).toHaveBeenCalledWith("analysis-456", "premium_report", "premium");
  });

  it("setzt accessLevel full für full_analysis", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_FULL_ANALYSIS_PRICE_ID = "price_full_123";
    createMockSession.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/test-session",
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({
      analysisId: "analysis-789",
      productType: "full_analysis",
      plan: "full",
    }));

    expect(response.status).toBe(200);
    expect(createMockSession).toHaveBeenCalledWith(expect.objectContaining({
      metadata: {
        analysisId: "analysis-789",
        productType: "full_analysis",
        accessLevel: "full",
        plan: "full",
      },
    }));
    expect(markAnalysisPendingMock).toHaveBeenCalledWith("analysis-789", "full_analysis", "full");
  });

  it("lehnt ungültigen productType ab", async () => {
    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({
      analysisId: "analysis-999",
      productType: "invalid_type",
    }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Produkt-Typ");
    expect(createMockSession).not.toHaveBeenCalled();
    expect(markAnalysisPendingMock).not.toHaveBeenCalled();
  });

  it("ignoriert fehlende markAnalysisPending und fährt mit Checkout fort", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PREMIUM_ANALYSIS_PRICE_ID = "price_premium_123";
    createMockSession.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/test-session",
    });
    markAnalysisPendingMock.mockRejectedValue(new Error("Supabase not configured"));

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({
      analysisId: "analysis-123",
      plan: "premium",
    }));
    const payload = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(payload.url).toBe("https://checkout.stripe.com/pay/test-session");
  });

  it("gibt einen 500-Fehler zurück, wenn Stripe keine URL liefert", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_FULL_ANALYSIS_PRICE_ID = "price_full_123";
    createMockSession.mockResolvedValue({
      url: null,
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({ analysisId: "analysis-789", plan: "full" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toContain("Stripe Checkout URL");
  });
});
