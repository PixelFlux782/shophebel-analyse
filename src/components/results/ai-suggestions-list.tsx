import { AiSuggestion } from "@/types/analysis";
import {
  FREE_VISIBLE_AI_SUGGESTIONS_LIMIT,
  getVisibleAiSuggestions,
} from "@/lib/ai/suggestion-helpers";

import { AiSuggestionCard } from "@/components/results/ai-suggestion-card";

interface AiSuggestionsListProps {
  suggestions: AiSuggestion[];
  isPremium: boolean;
}

export function AiSuggestionsList({
  suggestions,
  isPremium,
}: AiSuggestionsListProps) {
  const visibleSuggestions = getVisibleAiSuggestions(suggestions, isPremium);
  const hiddenSuggestionCount = Math.max(
    0,
    suggestions.length - Math.min(FREE_VISIBLE_AI_SUGGESTIONS_LIMIT, suggestions.length),
  );

  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        KI-Vorschlaege
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Konkrete Optimierungsvorschlaege
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Kurze, direkt umsetzbare Vorschlaege auf Basis der erkannten Probleme und sichtbaren Seitenstruktur.
      </p>

      {visibleSuggestions.length === 0 ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
          Für diese Analyse sind aktuell noch keine konkreten Optimierungsvorschlaege verfügbar.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {visibleSuggestions.map((suggestion) => (
            <AiSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isPremium={isPremium}
            />
          ))}
        </div>
      )}

      {!isPremium && hiddenSuggestionCount > 0 ? (
        <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          Noch {hiddenSuggestionCount} weitere Vorschlaege werden in der Vollanalyse sichtbar.
        </div>
      ) : null}
    </section>
  );
}
