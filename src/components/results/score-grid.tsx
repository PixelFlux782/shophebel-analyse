import { getScoreTone } from "@/lib/result-ui";
import { AnalysisResult } from "@/types/analysis";

interface ScoreGridProps {
  result: AnalysisResult;
}

export function ScoreGrid({ result }: ScoreGridProps) {
  const categories = result.categories;
  const clarityScore = Math.round((categories.conversion.score + categories.design.score) / 2);
  const mobileUxScore = Math.round((categories.performance.score + categories.design.score) / 2);
  const rows = [
    {
      title: "Vertrauen",
      score: categories.trust.score,
      description: categories.trust.summary,
      priority: "Hoch",
    },
    {
      title: "Klarheit",
      score: clarityScore,
      description: "Wie schnell Angebot, Nutzen und naechster Schritt verstanden werden.",
      priority: "Hoch",
    },
    {
      title: "Mobile UX",
      score: mobileUxScore,
      description: "Wie gut die Seite auf kleinen Screens wirkt und fuehrt.",
      priority: "Mittel",
    },
    {
      title: "Button",
      score: categories.conversion.score,
      description: "Wie klar Besucher zur naechsten Handlung gefuehrt werden.",
      priority: "Hoch",
    },
    {
      title: "Design",
      score: categories.design.score,
      description: categories.design.summary,
      priority: "Mittel",
    },
    {
      title: "Ladegefuehl",
      score: categories.performance.score,
      description: "Wie schnell und stabil sich die Seite im Check anfuehlt.",
      priority: "Mittel",
    },
    {
      title: "KI-Sichtbarkeit",
      score: categories.aiVisibility.score,
      description: categories.aiVisibility.summary,
      priority: "Hoch",
    },
  ];

  return (
    <div className="w-full" data-component="ScoreGrid">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Kategorieprofil als Prioritaetsliste
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Score-Ebenen ohne Kartenraster
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Die Bereiche sind nach Handlungsnaehe lesbar: Wert, Prioritaet und Grund stehen in einer kompakten Zeile.
        </p>
      </div>

      <section className="overflow-hidden rounded-[0.85rem] border border-slate-200 bg-white">
        {rows.map((row, index) => {
          const tone = getScoreTone(row.score);

          return (
            <article
              key={row.title}
              className="grid gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 lg:grid-cols-[8rem_minmax(0,1fr)_8rem_7rem] lg:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 font-mono text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="font-semibold text-slate-950">{row.title}</p>
              </div>
              <div>
                <p className="text-sm leading-6 text-slate-600">{row.description}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${tone.progress}`}
                    style={{ width: `${Math.max(8, Math.min(100, row.score))}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-3xl font-semibold text-slate-950">{row.score}</span>
              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                {row.priority}
              </span>
            </article>
          );
        })}
      </section>
    </div>
  );
}
