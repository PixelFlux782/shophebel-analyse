import { AnalysisResult } from "@/types/analysis";

import { ScoreCard } from "@/components/results/score-card";

interface ScoreGridProps {
  result: AnalysisResult;
}

export function ScoreGrid({ result }: ScoreGridProps) {
  const categories = result.categories;
  const clarityScore = Math.round((categories.conversion.score + categories.design.score) / 2);
  const mobileUxScore = Math.round((categories.performance.score + categories.design.score) / 2);

  return (
    <div className="relative w-full">
      {/* Subtiler Hintergrund-Glow für das gesamte Grid */}
      <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      
      <section className="grid w-full items-stretch gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 relative z-10">
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
        title="CTA"
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
        title="AI-Sichtbarkeit"
        score={categories.aiVisibility.score}
        description={categories.aiVisibility.summary}
      />
      </section>
    </div>
  );
}
