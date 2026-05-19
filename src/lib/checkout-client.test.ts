import { describe, expect, it } from "vitest";

import { buildCheckoutRequestPayload } from "@/lib/checkout-client";

describe("buildCheckoutRequestPayload", () => {
  it("erstellt den Payload für Premium-Report-Checkout", () => {
    expect(buildCheckoutRequestPayload({
      analysisId: "analysis-123",
      productType: "premium_report",
      plan: "premium",
    })).toEqual({
      analysisId: "analysis-123",
      productType: "premium_report",
      plan: "premium",
    });
  });
});
