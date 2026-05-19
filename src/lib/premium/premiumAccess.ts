export type AnalysisPlan = "free" | "full" | "premium";
export type PaymentStatus = "free" | "unpaid" | "paid" | string;

export type AnalysisAccessInput = {
  paymentStatus?: PaymentStatus | null;
  plan?: string | null;
  productType?: string | null;
  isPremium?: boolean | null;
};

function normalizePlan(value?: string | null): AnalysisPlan | null {
  if (value === "free" || value === "full" || value === "premium") {
    return value;
  }

  if (value === "full_analysis") {
    return "full";
  }

  if (value === "premium_report") {
    return "premium";
  }

  if (value === "analysis_teaser") {
    return "free";
  }

  return null;
}

export function resolveAnalysisPlan(input: AnalysisAccessInput = {}): AnalysisPlan {
  if (input.isPremium) {
    return "premium";
  }

  const normalizedPlan = normalizePlan(input.plan);
  const normalizedProductType = normalizePlan(input.productType);

  if (
    input.paymentStatus === "paid" &&
    (!normalizedPlan || normalizedPlan === "free") &&
    (!normalizedProductType || normalizedProductType === "free")
  ) {
    return "premium";
  }

  if (normalizedPlan) {
    return normalizedPlan;
  }

  if (normalizedProductType) {
    return normalizedProductType;
  }

  if (input.paymentStatus === "paid") {
    return "premium";
  }

  return "free";
}

export function canViewFullAnalysis(input: AnalysisAccessInput = {}) {
  const plan = resolveAnalysisPlan(input);
  return plan === "full" || plan === "premium";
}

export function canViewPremiumReport(input: AnalysisAccessInput | string | null | undefined) {
  if (typeof input === "string" || input === null || input === undefined) {
    return input === "paid";
  }

  return resolveAnalysisPlan(input) === "premium";
}
