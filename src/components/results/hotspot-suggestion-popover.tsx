import { AiSuggestion } from "@/types/analysis";
import { VisualHotspot } from "@/lib/result-ui";

interface HotspotSuggestionPopoverProps {
  hotspot: VisualHotspot;
  suggestion?: AiSuggestion;
  toneClasses: {
    dot: string;
    badge: string;
  };
}

export function HotspotSuggestionPopover({
  hotspot,
  suggestion,
  toneClasses,
}: HotspotSuggestionPopoverProps) {
  return (
    <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 hidden w-72 rounded-2xl border border-slate-200 bg-white/98 p-4 text-left shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] group-hover:block">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${toneClasses.dot}`} />
        <p className="text-sm font-semibold text-slate-950">{hotspot.title}</p>
      </div>
      <p className="mt-2 text-xs leading-6 text-slate-600">{hotspot.description}</p>

      {suggestion ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClasses.badge}`}
          >
            Optimierung
          </span>
          <p className="mt-2 text-sm font-semibold text-slate-950">{suggestion.title}</p>
          <p className="mt-2 text-xs leading-6 text-slate-600">{suggestion.summary}</p>
          {suggestion.actionSteps.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs leading-6 text-slate-600">
              {suggestion.actionSteps.slice(0, 2).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {hotspot.label ? (
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Bezug: {hotspot.label}
        </p>
      ) : null}
    </div>
  );
}
