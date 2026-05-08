import { AnalysisResult } from "@/types/analysis";
import { getAnalysisSummary } from "@/lib/result-ui";

interface AnalysisSummaryProps {
  result: AnalysisResult;
}

export function AnalysisSummary({ result }: AnalysisSummaryProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Kurzfazit
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Die wichtigsten Hebel auf einen Blick
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
        {getAnalysisSummary(result)}
      </p>
      <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Technische Info
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Analysemodus:{" "}
          {result.analysisMode === "rendered"
            ? "Gerenderte Seitenansicht"
            : "Statische HTML-Auswertung"}
        </p>
        {result.technicalNotes && result.technicalNotes.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {result.technicalNotes.map((note) => (
              <li key={note} className="rounded-xl bg-white px-3 py-3">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
