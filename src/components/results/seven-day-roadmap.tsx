import type { ActionMeasure } from "@/types/analysis";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { polishPremiumText } from "@/lib/premium/premiumCopy";

type QuickStep = NonNullable<PremiumReport["quickImplementationPlan"]>[number];

interface SevenDayRoadmapProps {
  quickPlan?: QuickStep[];
  measures?: ActionMeasure[];
}

function fallbackSteps(measures: ActionMeasure[] = []): QuickStep[] {
  const topMeasures = measures.slice(0, 6);

  if (topMeasures.length === 0) {
    return [];
  }

  return [
    {
      days: "Tag 1-2",
      focus: "Klarheit im sichtbaren Startbereich",
      actions: topMeasures.slice(0, 2).map((measure) => measure.description),
    },
    {
      days: "Tag 3-5",
      focus: "Vertrauen und Handlung sichtbarer machen",
      actions: topMeasures.slice(2, 4).map((measure) => measure.description),
    },
    {
      days: "Tag 6-7",
      focus: "Pruefen, verdichten und priorisieren",
      actions: topMeasures.slice(4, 6).map((measure) => measure.description),
    },
  ].filter((step) => step.actions.length > 0);
}

export function SevenDayRoadmap({ quickPlan, measures }: SevenDayRoadmapProps) {
  const steps = quickPlan?.length ? quickPlan : fallbackSteps(measures);

  if (steps.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.32)] sm:p-7">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
          7-Tage-Fahrplan
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Die naechsten Schritte in sinnvoller Reihenfolge.
        </h2>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Der Fahrplan uebersetzt die wichtigsten Hebel in eine kurze Arbeitsstrecke, damit nicht alles gleichzeitig angefasst werden muss.
        </p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <article key={`${step.days}-${step.focus}`} className="rounded-[1.45rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              {polishPremiumText(step.days)}
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">{polishPremiumText(step.focus)}</h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {step.actions.map((action) => (
                <li key={action}>{polishPremiumText(action)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
