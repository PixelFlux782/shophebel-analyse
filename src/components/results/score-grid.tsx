import { ScoreCard } from "@/components/results/score-card";
import { AnalysisResult } from "@/types/analysis";

interface ScoreGridProps {
  result: AnalysisResult;
}

export function ScoreGrid({ result }: ScoreGridProps) {
  const categories = result.categories;
  const clarityScore = Math.round((categories.conversion.score + categories.design.score) / 2);
  const mobileUxScore = Math.round((categories.performance.score + categories.design.score) / 2);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Kategorieprofil
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Score-Ebenen im Überblick
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Die Karten zeigen die Analysebereiche kompakt, damit Detailbefunde nicht mit der Hauptdiagnose konkurrieren.
        </p>
      </div>

      <section className="grid w-full items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ScoreCard
          title="Vertrauen"
          score={categories.trust.score}
          description={categories.trust.summary}
        />
        <ScoreCard
          title="Klarheit"
          score={clarityScore}
          description="Wie schnell Angebot, Nutzen und nächster Schritt verstanden werden."
        />
        <ScoreCard
          title="Mobile UX"
          score={mobileUxScore}
          description="Wie gut die Seite auf kleinen Screens wirkt und führt."
        />
        <ScoreCard
          title="Button"
          score={categories.conversion.score}
          description="Wie klar Besucher zur nächsten Handlung geführt werden."
        />
        <ScoreCard
          title="Design"
          score={categories.design.score}
          description={categories.design.summary}
        />
        <ScoreCard
          title="Ladegefühl"
          score={categories.performance.score}
          description="Wie schnell und stabil sich die Seite im Check anfühlt."
        />
        <ScoreCard
          title="KI-Sichtbarkeit"
          score={categories.aiVisibility.score}
          description={categories.aiVisibility.summary}
        />
      </section>
    </div>
  );
}
