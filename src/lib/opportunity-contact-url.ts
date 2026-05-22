import { SHOPHEBEL_HOME_URL } from "@/lib/env";

const DEFAULT_MARKETING_URL = "https://shophebel.vercel.app/";

function createMarketingUrl() {
  try {
    return new URL(SHOPHEBEL_HOME_URL || DEFAULT_MARKETING_URL);
  } catch {
    return new URL(DEFAULT_MARKETING_URL);
  }
}

export function buildOpportunityContactUrl(input: {
  opportunityTitle?: string;
  businessImpact?: string;
  suggestedModule?: string;
  suggestedService?: string;
  ctaLabel?: string;
  source: "analysis" | "premium";
}): string {
  const url = createMarketingUrl();

  url.searchParams.set("opportunity", input.opportunityTitle ?? "");
  url.searchParams.set("opportunitySource", input.source);
  url.searchParams.set("impact", input.businessImpact ?? "");
  url.searchParams.set("module", input.suggestedModule ?? "");
  url.searchParams.set("service", input.suggestedService ?? "");
  url.searchParams.set("cta", input.ctaLabel ?? "");
  url.hash = "kontakt";

  return url.toString();
}
