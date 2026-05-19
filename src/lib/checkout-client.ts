export type CheckoutProductType = "full_analysis" | "premium_report";
export type CheckoutPlan = "full" | "premium";

export type CheckoutRequestPayload = {
  analysisId: string;
  productType?: CheckoutProductType;
  plan?: CheckoutPlan;
};

export function buildCheckoutRequestPayload(input: {
  analysisId: string;
  productType?: CheckoutProductType;
  plan?: CheckoutPlan;
}): CheckoutRequestPayload {
  return {
    analysisId: input.analysisId,
    productType: input.productType,
    plan: input.plan,
  };
}
