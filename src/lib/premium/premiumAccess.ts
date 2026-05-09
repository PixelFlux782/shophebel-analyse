export function canViewPremiumReport(paymentStatus?: string | null) {
  return paymentStatus === "paid";
}
