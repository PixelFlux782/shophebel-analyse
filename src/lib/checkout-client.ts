export type CheckoutProductType = "premium_report";

export type CheckoutRequestPayload = {
  analysisId: string;
  productType?: CheckoutProductType;
  plan?: string;
};

export function buildCheckoutRequestPayload(input: {
  analysisId: string;
  productType?: CheckoutProductType;
  plan?: string;
}): CheckoutRequestPayload {
  return {
    analysisId: input.analysisId,
    productType: input.productType,
    plan: input.plan,
  };
}
