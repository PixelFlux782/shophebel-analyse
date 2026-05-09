import { Recommendation } from "@/types/analysis";
import { FREE_VISIBLE_RECOMMENDATIONS_LIMIT, getVisibleRecommendations } from "@/lib/result-ui";

import { RecommendationCard } from "@/components/results/recommendation-card";

interface RecommendationsListProps {
  recommendations: Recommendation[];
  isPremium: boolean;
}

export function RecommendationsList({
  recommendations,
  isPremium,
}: RecommendationsListProps) {
  const visibleRecommendations = getVisibleRecommendations(recommendations, isPremium);
  const hiddenRecommendationCount = Math.max(
    0,
    recommendations.length - Math.min(FREE_VISIBLE_RECOMMENDATIONS_LIMIT, recommendations.length),
  );

  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Empfehlungen
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Empfohlene nächste Schritte
      </h2>
      {!isPremium && hiddenRecommendationCount > 0 ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">
          In der kostenlosen Analyse zeigen wir dir die wichtigsten ersten Schritte. Die Vollanalyse oeffnet alle Empfehlungen inklusive genauer Priorisierung.
        </p>
      ) : null}

      {visibleRecommendations.length === 0 ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
          Aktuell liegen keine konkreten Empfehlungen vor. Führe bei Bedarf eine neue Analyse aus oder nutze die Vollanalyse für mehr Tiefe.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {visibleRecommendations.map((recommendation) => (
            <RecommendationCard
              key={`${recommendation.category}-${recommendation.title}`}
              recommendation={recommendation}
              isPremium={isPremium}
            />
          ))}
        </div>
      )}

      {!isPremium && hiddenRecommendationCount > 0 ? (
        <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          Noch {hiddenRecommendationCount} weitere Empfehlungen werden in der Vollanalyse sichtbar.
        </div>
      ) : null}
    </section>
  );
}
