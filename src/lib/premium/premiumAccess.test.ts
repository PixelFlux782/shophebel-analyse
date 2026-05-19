import { describe, expect, it } from "vitest";

import {
  canViewFullAnalysis,
  canViewPremiumReport,
  resolveAnalysisPlan,
} from "@/lib/premium/premiumAccess";

describe("canViewPremiumReport", () => {
  it("zeigt Premiumdaten nur bei paid", () => {
    expect(canViewPremiumReport("paid")).toBe(true);
    expect(canViewPremiumReport("open")).toBe(false);
    expect(canViewPremiumReport(null)).toBe(false);
    expect(canViewPremiumReport(undefined)).toBe(false);
  });

  it("unterscheidet free, full und premium", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "free", plan: "free" })).toBe("free");
    expect(resolveAnalysisPlan({ paymentStatus: "paid", plan: "full" })).toBe("full");
    expect(resolveAnalysisPlan({ paymentStatus: "paid", plan: "premium" })).toBe("premium");
    expect(resolveAnalysisPlan({ paymentStatus: "paid" })).toBe("premium");
    expect(resolveAnalysisPlan({ isPremium: true, plan: "free" })).toBe("premium");
    expect(canViewFullAnalysis({ paymentStatus: "paid", plan: "full" })).toBe(true);
    expect(canViewPremiumReport({ paymentStatus: "paid", plan: "full" })).toBe(false);
  });
});
