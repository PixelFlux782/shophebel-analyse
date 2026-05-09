import { describe, expect, it } from "vitest";

import { canViewPremiumReport } from "@/lib/premium/premiumAccess";

describe("canViewPremiumReport", () => {
  it("zeigt Premiumdaten nur bei paid", () => {
    expect(canViewPremiumReport("paid")).toBe(true);
    expect(canViewPremiumReport("open")).toBe(false);
    expect(canViewPremiumReport(null)).toBe(false);
    expect(canViewPremiumReport(undefined)).toBe(false);
  });
});
