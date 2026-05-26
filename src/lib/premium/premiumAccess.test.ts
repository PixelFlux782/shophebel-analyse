import { describe, expect, it } from "vitest";

import {
  canViewFullAnalysis,
  canViewPremiumReport,
  resolveAccessLevel,
  resolveAnalysisPlan,
} from "@/lib/premium/premiumAccess";

describe("premium access logic", () => {
  it("does not grant full or premium access for free analyses", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "free", accessLevel: "free" })).toBe("free");
    expect(canViewFullAnalysis({ paymentStatus: "free", accessLevel: "free" })).toBe(false);
    expect(canViewPremiumReport({ paymentStatus: "free", accessLevel: "premium" })).toBe(false);
  });

  it("grants full access only for paid + full or premium access_level", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "paid", accessLevel: "full" })).toBe("full");
    expect(canViewFullAnalysis({ paymentStatus: "paid", accessLevel: "full" })).toBe(true);
    expect(canViewPremiumReport({ paymentStatus: "paid", accessLevel: "full" })).toBe(false);
  });

  it("grants premium access only for paid + premium access_level", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "paid", accessLevel: "premium" })).toBe("premium");
    expect(canViewFullAnalysis({ paymentStatus: "paid", accessLevel: "premium" })).toBe(true);
    expect(canViewPremiumReport({ paymentStatus: "paid", accessLevel: "premium" })).toBe(true);
  });

  it("does not grant paid access from success/upgrade query state without paid status", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "free", accessLevel: "premium" })).toBe("free");
    expect(resolveAnalysisPlan({ paymentStatus: "pending", accessLevel: "full" })).toBe("free");
  });

  it("uses legacy plan/is_premium only when access_level is missing", () => {
    expect(resolveAnalysisPlan({ paymentStatus: "paid", plan: "premium" })).toBe("premium");
    expect(resolveAnalysisPlan({ paymentStatus: "paid", accessLevel: null, plan: "full" })).toBe("full");
    expect(resolveAnalysisPlan({ paymentStatus: "paid", accessLevel: "free", plan: "premium" })).toBe("free");
    expect(resolveAnalysisPlan({ paymentStatus: "paid", accessLevel: null, isPremium: true })).toBe("premium");
  });

  it("resolves access from all persisted payment fields in one helper", () => {
    expect(resolveAccessLevel({ paidAt: "2026-05-08T12:30:00.000Z", productType: "full_analysis" })).toBe("full");
    expect(resolveAccessLevel({ paidAt: "2026-05-08T12:30:00.000Z", productType: "premium_report" })).toBe("premium");
    expect(resolveAccessLevel({ paymentStatus: "pending", accessLevel: "premium", stripeSessionId: "cs_test_123" })).toBe("free");
    expect(resolveAccessLevel({ paymentStatus: "pending", isPremium: true })).toBe("free");
  });
});
