import Link from "next/link";

import { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { polishPremiumText } from "@/lib/premium/premiumCopy";

type PremiumReportSectionReport = Partial<PremiumReport> & {
  premiumSummary?: Partial<PremiumReport["premiumSummary"]>;
};

function text(value: unknown, fallback = "Noch nicht im Premium-Report enthalten.") {
  return polishPremiumText(value, fallback);
}

export function PremiumReportSection({
  report,
  analysisId,
}: {
  report: PremiumReportSectionReport;
  analysisId?: string;
}) {
  const premiumSummary: Partial<PremiumReport["premiumSummary"]> = report.premiumSummary ?? {};
  const topRevenueBlockers = report.topRevenueBlockers ?? [];
  const quickImplementationPlan = report.quickImplementationPlan ?? [];
  const visualAuditNotes = report.visualAuditNotes ?? [];
  const priorityRoadmap = report.priorityRoadmap ?? [];
  const pdfHref = analysisId
    ? `/api/premium-report/${encodeURIComponent(analysisId)}/pdf`
    : null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_42%,_#ecfeff_100%)] text-slate-950 shadow-[0_36px_140px_-70px_rgba(15,23,42,0.55)]">
      <div className="border-b border-amber-200/70 bg-slate-950 px-5 py-6 text-white sm:px-7 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
              Premium freigeschaltet
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Dein Premium-Report
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
              Priorisierte Umsatzbremsen, 7-Tage-Plan und konkrete Maßnahmen.
            </p>
          </div>
          {pdfHref ? (
            <Link
              href={pdfHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 text-base font-extrabold text-slate-950 shadow-[0_20px_60px_-28px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
            >
              Premium-PDF herunterladen
            </Link>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_20px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Management-Zusammenfassung
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              {text(premiumSummary.headline, "Premium Anfrage- und Vertrauens-Audit")}
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>{text(premiumSummary.mainReason, "Der Premium-Report fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen.")}</p>
              {premiumSummary.firstFocus ? <p>{text(premiumSummary.firstFocus)}</p> : null}
              {premiumSummary.businessRelevance ? <p>{text(premiumSummary.businessRelevance)}</p> : null}
            </div>
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-900">
              Schnellster Hebel: {text(premiumSummary.fastestWin, "Die wichtigste Maßnahme zuerst umsetzen.")}
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_20px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Wirklogik
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">Conversion-Hypothese</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {text(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.")}
            </p>
          </article>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold text-slate-950">Top-Umsatzbremsen</h3>
          <div className="mt-4 grid gap-4">
            {topRevenueBlockers.map((blocker) => (
              <article key={`${blocker.priority}-${blocker.title}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.5)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                      {text(blocker.category)} · {text(blocker.severity)}
                    </p>
                    <h4 className="mt-2 text-xl font-bold text-slate-950">
                      {blocker.priority}. {text(blocker.title)}
                    </h4>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    Aufwand: {text(blocker.effort)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{text(blocker.whyItMatters)}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{text(blocker.likelyBusinessImpact)}</p>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-950">{text(blocker.recommendedFix)}</p>
              </article>
            ))}
            {topRevenueBlockers.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
                Für diesen Report wurden keine separaten Umsatzbremsen gespeichert.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.5)]">
            <h3 className="text-xl font-bold text-slate-950">7-Tage-Plan</h3>
            <div className="mt-4 space-y-4">
              {quickImplementationPlan.map((step) => (
                <div key={step.days}>
                  <p className="text-sm font-bold text-cyan-700">{text(step.days)}: {text(step.focus)}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                    {step.actions.map((action) => <li key={action}>{text(action)}</li>)}
                  </ul>
                </div>
              ))}
              {quickImplementationPlan.length === 0 ? (
                <p className="text-sm leading-7 text-slate-700">
                  Kein Umsetzungsplan im gespeicherten Report vorhanden.
                </p>
              ) : null}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.5)]">
            <h3 className="text-xl font-bold text-slate-950">Visuelle Prüfung</h3>
            <div className="mt-4 space-y-3">
              {visualAuditNotes.map((note) => (
                <div key={note.area}>
                  <p className="text-sm font-bold text-slate-950">{text(note.area)}</p>
                  <p className="text-sm leading-7 text-slate-700">{text(note.note)}</p>
                </div>
              ))}
              {visualAuditNotes.length === 0 ? (
                <p className="text-sm leading-7 text-slate-700">
                  Keine Hinweise zur visuellen Prüfung im gespeicherten Report vorhanden.
                </p>
              ) : null}
            </div>
          </article>
        </div>

        <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.5)]">
          <h3 className="text-xl font-bold text-slate-950">Priorisierte Maßnahmen</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
            {priorityRoadmap.map((item) => <li key={item}>{text(item)}</li>)}
          </ol>
          {priorityRoadmap.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Keine priorisierten Maßnahmen im gespeicherten Report vorhanden.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
