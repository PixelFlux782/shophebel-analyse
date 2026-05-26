export type AnalysisPlan = "free" | "full" | "premium";
export type PaymentStatus = "free" | "pending" | "paid" | "failed" | string;

export type AnalysisAccessInput = {
  accessLevel?: string | null;
  paymentStatus?: PaymentStatus | null;
  paidAt?: string | null;
  plan?: string | null;
  productType?: string | null;
  isPremium?: boolean | null;
  stripeSessionId?: string | null;
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

function normalizeAccessLevel(value?: string | null): AnalysisPlan | null {
  return normalizePlan(value);
}

export function resolveAnalysisPlan(input: AnalysisAccessInput = {}): AnalysisPlan {
  return resolveAccessLevel(input);
}

export function resolveAccessLevel(input: AnalysisAccessInput = {}): AnalysisPlan {
  const paymentStatus = input.paymentStatus?.trim().toLowerCase() ?? "free";
  const accessLevel = normalizeAccessLevel(input.accessLevel);
  const productPlan = normalizePlan(input.productType);
  const legacyPlan = normalizePlan(input.plan);
  const hasPaidSignal = paymentStatus === "paid" || Boolean(input.paidAt);

  if (hasPaidSignal) {
    if (accessLevel) {
      return accessLevel;
    }

    if (productPlan) {
      return productPlan;
    }

    if (legacyPlan) {
      return legacyPlan;
    }

    if (input.isPremium) {
      return "premium";
    }

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
