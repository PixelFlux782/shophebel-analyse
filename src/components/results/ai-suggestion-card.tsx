import { AiSuggestion } from "@/types/analysis";
import { getCategoryLabel } from "@/lib/ai/suggestion-helpers";

const impactClasses: Record<AiSuggestion["expectedImpact"], string> = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

interface AiSuggestionCardProps {
  suggestion: AiSuggestion;
  isPremium: boolean;
}

export function AiSuggestionCard({
  suggestion,
  isPremium,
}: AiSuggestionCardProps) {
  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/85 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {getCategoryLabel(suggestion.category)}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${impactClasses[suggestion.expectedImpact]}`}
        >
          Impact {suggestion.expectedImpact}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">{suggestion.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{suggestion.summary}</p>

      {suggestion.linkedFindingTitle ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          Bezug: {suggestion.linkedFindingTitle}
        </p>
      ) : null}

      {isPremium ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          {suggestion.actionSteps.map((step) => (
            <li key={step} className="rounded-xl bg-white px-3 py-3">
              {step}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          {suggestion.actionSteps.slice(0, 2).map((step) => (
            <li key={step} className="rounded-xl bg-white px-3 py-3">
              {step}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
