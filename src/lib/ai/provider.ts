import { AiSuggestion } from "@/types/analysis";

import { SuggestionInputItem } from "@/lib/ai/build-suggestion-input";

export interface SuggestionProvider {
  generateSuggestions(input: SuggestionInputItem[]): Promise<AiSuggestion[]>;
}
