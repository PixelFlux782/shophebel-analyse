import { Recommendation } from "@/types/analysis";
import { getRecommendationLabel } from "@/lib/result-ui";
import { normalizeGermanReportText } from "@/lib/report/reportCopy";

const impactClasses: Record<Recommendation["impact"], string> = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const effortClasses: Record<Recommendation["effort"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-slate-100 text-slate-700",
  high: "bg-slate-200 text-slate-800",
};

const priorityLabels: Record<Recommendation["impact"], string> = {
  high: "hoch",
  medium: "mittel",
  low: "gering",
};

const effortLabels: Record<Recommendation["effort"], string> = {
  low: "niedrig",
  medium: "mittel",
  high: "hoch",
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  isPremium: boolean;
}

export function RecommendationCard({
  recommendation,
  isPremium,
}: RecommendationCardProps) {
  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/85 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {normalizeGermanReportText(recommendation.category)}
        </span>
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
          {getRecommendationLabel(recommendation)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">
        {normalizeGermanReportText(recommendation.title)}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        {normalizeGermanReportText(recommendation.description)}
      </p>

      {isPremium ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${impactClasses[recommendation.impact]}`}
          >
            Wirkung {priorityLabels[recommendation.impact]}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${effortClasses[recommendation.effort]}`}
          >
            Aufwand {effortLabels[recommendation.effort]}
          </span>
        </div>
      ) : null}
    </article>
  );
}
