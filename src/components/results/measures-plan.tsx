import { ActionMeasure } from "@/types/analysis";

interface MeasuresPlanProps {
  measures: ActionMeasure[];
}

const effortClasses: Record<ActionMeasure["effort"], string> = {
  niedrig: "bg-emerald-100 text-emerald-800",
  mittel: "bg-amber-100 text-amber-800",
  hoch: "bg-rose-100 text-rose-800",
};

const impactClasses: Record<ActionMeasure["impact"], string> = {
  niedrig: "bg-slate-100 text-slate-700",
  mittel: "bg-cyan-100 text-cyan-800",
  hoch: "bg-violet-100 text-violet-800",
};

export function MeasuresPlan({ measures }: MeasuresPlanProps) {
  if (measures.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.32)] sm:p-7">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
          Massnahmen-Engine
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Aus Problemen werden konkrete Handlungen.
        </h2>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Jede Massnahme entsteht automatisch aus einem gefundenen Problem und ist nach Aufwand, Wirkung und Prioritaet sortiert.
        </p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {measures.slice(0, 8).map((measure) => (
          <article key={`${measure.category}-${measure.title}`} className="rounded-[1.45rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {measure.category}
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{measure.title}</h3>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                Prioritaet {measure.priority}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{measure.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${effortClasses[measure.effort]}`}>
                Aufwand: {measure.effort}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${impactClasses[measure.impact]}`}>
                Wirkung: {measure.impact}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
