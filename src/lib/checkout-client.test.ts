import { describe, expect, it } from "vitest";

import { buildCheckoutRequestPayload } from "@/lib/checkout-client";

describe("buildCheckoutRequestPayload", () => {
  it("erstellt den Payload fuer Premium-Report-Checkout", () => {
    expect(buildCheckoutRequestPayload({
      analysisId: "analysis-123",
      productType: "premium_report",
      plan: "premium_report",
    })).toEqual({
      analysisId: "analysis-123",
      productType: "premium_report",
      plan: "premium_report",
    });
  });
});
