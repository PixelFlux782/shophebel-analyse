import { AiSuggestion, Finding } from "@/types/analysis";
import { AnalysisResult } from "@/types/analysis";

import { SuggestionInputItem, buildSuggestionInput } from "@/lib/ai/build-suggestion-input";
import { SuggestionProvider } from "@/lib/ai/provider";
import {
  buildFindingKey,
  mapFindingToSuggestionTemplate,
  sortSuggestions,
} from "@/lib/ai/suggestion-helpers";

class LocalSuggestionProvider implements SuggestionProvider {
  async generateSuggestions(input: SuggestionInputItem[]) {
    return input.map((item) => {
      const template = mapFindingToSuggestionTemplate({
        category: item.category,
        status: "warning",
        title: item.title,
        description: item.description,
        priority: item.priority,
      });

      return {
        id: `suggestion-${item.findingKey}`,
        title: template.title,
        summary: item.visualHint
          ? `${template.summary} ${item.visualHint}`
          : template.summary,
        actionSteps: template.actionSteps.slice(0, 4),
        expectedImpact: template.expectedImpact,
        category: item.category,
        linkedFindingTitle: item.title,
        linkedFindingKey: item.findingKey,
      } satisfies AiSuggestion;
    });
  }
}

function getSuggestionProvider(): SuggestionProvider {
  return new LocalSuggestionProvider();
}

function dedupeSuggestions(suggestions: AiSuggestion[]) {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = suggestion.linkedFindingKey ?? `${suggestion.category}:${suggestion.title}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function generateSuggestions(result: AnalysisResult) {
  const provider = getSuggestionProvider();
  const input = buildSuggestionInput(result);

  if (input.length === 0) {
    return [];
  }

  const suggestions = await provider.generateSuggestions(input);
  return sortSuggestions(dedupeSuggestions(suggestions));
}

export function getSuggestionForFinding(
  suggestions: AiSuggestion[] | undefined,
  finding: Finding,
) {
  const findingKey = buildFindingKey(finding);

  return suggestions?.find(
    (suggestion) =>
      suggestion.linkedFindingKey === findingKey ||
      suggestion.linkedFindingTitle === finding.title,
  );
}
