import type { PremiumPromptMessage } from "@/lib/ai/promptBuilder";

export type PremiumReportProvider = {
  generate(messages: PremiumPromptMessage[]): Promise<string>;
};
