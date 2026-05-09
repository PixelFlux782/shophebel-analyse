import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMockSession = vi.fn();

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
    createMockSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("gibt in Production ohne Stripe-Konfiguration einen Fehler zurueck", async () => {
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
    expect(payload.url).toContain("/analyse/result/analysis-123?checkout=demo");
    expect(payload.url).not.toContain("/checkout/success");
    expect(createMockSession).not.toHaveBeenCalled();
  });

  it("gibt bei fehlender analysisId einen 400-Fehler zurueck", async () => {
    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({}));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Analyse-ID");
  });

  it("erstellt mit Stripe-Konfiguration eine Checkout-Session", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_ID = "price_123";
    createMockSession.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/test-session",
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({
      analysisId: "analysis-456",
      productType: "premium_report",
      plan: "premium_report",
    }));
    const payload = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(createMockSession).toHaveBeenCalledOnce();
    expect(createMockSession).toHaveBeenCalledWith(expect.objectContaining({
      success_url: expect.stringContaining(
        "/checkout/success?analysisId=analysis-456",
      ),
      cancel_url: expect.stringContaining("/analyse/result/analysis-456"),
      metadata: {
        analysisId: "analysis-456",
        productType: "premium_report",
        plan: "premium_report",
      },
    }));
    expect(payload.url).toBe("https://checkout.stripe.com/pay/test-session");
  });

  it("gibt einen 500-Fehler zurueck, wenn Stripe keine URL liefert", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_ID = "price_123";
    createMockSession.mockResolvedValue({
      url: null,
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(createRequest({ analysisId: "analysis-789" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toContain("Stripe Checkout URL");
  });
});
