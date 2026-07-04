import type { PremiumPromptMessage } from "@/lib/ai/promptBuilder";

export type PremiumReportUsage = {
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  estimatedCost?: number | null;
  isEstimated?: boolean;
};

export type PremiumReportProviderResult = {
  content: string;
  usage?: PremiumReportUsage | null;
};

export type PremiumReportProvider = {
  generate(messages: PremiumPromptMessage[]): Promise<string | PremiumReportProviderResult>;
};
