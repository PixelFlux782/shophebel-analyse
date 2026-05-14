import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { constructEventMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
}));

vi.mock("stripe", () => {
  return {
    default: class Stripe {
      webhooks = {
        constructEvent: constructEventMock,
      };
    },
  };
});

function createRequest(body = "{}") {
  return new NextRequest("http://localhost:3001/api/stripe/webhook", {
    method: "POST",
    body,
    headers: {
      "stripe-signature": "test-signature",
    },
  });
}

function createRequestWithoutSignature(body = "{}") {
  return new NextRequest("http://localhost:3001/api/stripe/webhook", {
    method: "POST",
    body,
  });
}

function createCheckoutCompletedEvent(metadata: Record<string, string> = { analysisId: "analysis-123" }) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        metadata,
        customer_details: {
          email: "kunde@example.test",
        },
        customer_email: null,
      },
    },
  };
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_123");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    constructEventMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("aktualisiert analysis_results bei gültigem checkout.session.completed Event", async () => {
    constructEventMock.mockReturnValue(createCheckoutCompletedEvent({
      analysisId: "analysis-123",
      productType: "premium_report",
      plan: "premium_report",
    }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequest("stripe-body"));

    expect(response.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith("stripe-body", "test-signature", "whsec_test_123");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("stripe_session_id=eq.cs_test_123");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://example.supabase.co/rest/v1/analysis_results?id=eq.analysis-123",
    );

    const [, patchInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const payload = JSON.parse(patchInit.body as string) as {
      payment_status: string;
      stripe_session_id: string;
      stripe_customer_email: string;
      product_type: string;
      plan: string;
      paid_at: string;
    };

    expect(patchInit.method).toBe("PATCH");
    expect(payload.payment_status).toBe("paid");
    expect(payload.stripe_session_id).toBe("cs_test_123");
    expect(payload.stripe_customer_email).toBe("kunde@example.test");
    expect(payload.product_type).toBe("premium_report");
    expect(payload.plan).toBe("premium_report");
    expect(payload.paid_at).toBeTruthy();
  });

  it("lehnt ungültige Signaturen ab", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature.");
    });
    const fetchMock = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequest("stripe-body"));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("No signatures");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[stripe-webhook] constructEvent failed", {
      reason: "No signatures found matching the expected signature.",
      hasSignature: true,
      rawBodyLength: "stripe-body".length,
    });
  });

  it("meldet fehlendes STRIPE_WEBHOOK_SECRET klar", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequest("stripe-body"));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(payload.error).toContain("webhook secret");
    expect(errorSpy).toHaveBeenCalledWith("[stripe-webhook] missing STRIPE_WEBHOOK_SECRET");
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("meldet fehlenden stripe-signature Header klar", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequestWithoutSignature("stripe-body"));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("signature");
    expect(errorSpy).toHaveBeenCalledWith("[stripe-webhook] missing stripe-signature header");
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("bleibt bei wiederholtem Event idempotent", async () => {
    constructEventMock.mockReturnValue(createCheckoutCompletedEvent());
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "analysis-123" }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequest("stripe-body"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("stripe_session_id=eq.cs_test_123");
  });

  it("crasht bei fehlender analysisId nicht", async () => {
    constructEventMock.mockReturnValue(createCheckoutCompletedEvent({}));
    const fetchMock = vi.fn();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(createRequest("stripe-body"));

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "[stripe-webhook] checkout.session.completed without analysisId metadata",
    );
  });
});
