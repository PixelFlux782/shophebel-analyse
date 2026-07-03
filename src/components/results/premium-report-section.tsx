import Link from "next/link";
import type { ReactNode } from "react";

import { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { polishPremiumText } from "@/lib/premium/premiumCopy";

type PremiumReportSectionReport = Partial<PremiumReport> & {
  premiumSummary?: Partial<PremiumReport["premiumSummary"]>;
};

function text(value: unknown, fallback = "Fuer diesen Punkt liegt noch keine separate Kundenangabe vor.") {
  return polishPremiumText(value, fallback);
}

export function PremiumReportSection({
  report,
  analysisId,
  children,
}: {
  report: PremiumReportSectionReport;
  analysisId?: string;
  children?: ReactNode;
}) {
  const premiumSummary: Partial<PremiumReport["premiumSummary"]> = report.premiumSummary ?? {};
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
              Premium-Bericht inkl. KI-Beratung
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
              Vollstaendige visuelle Analyse, priorisierte Empfehlungen, 7-Tage-Fahrplan, KI-Premiumbericht und PDF-Export in einem Arbeitsbereich.
            </p>
          </div>
          {pdfHref ? (
            <Link
              href={pdfHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 text-base font-extrabold text-slate-950 shadow-[0_20px_60px_-28px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
            >
              PDF herunterladen
            </Link>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_20px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Kurzueberblick
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              {text(premiumSummary.headline, "Premium Anfrage- und Vertrauens-Audit")}
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>{text(premiumSummary.mainReason, "Der Premium-Bericht fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen.")}</p>
              {premiumSummary.firstFocus ? <p>{text(premiumSummary.firstFocus)}</p> : null}
              {premiumSummary.businessRelevance ? <p>{text(premiumSummary.businessRelevance)}</p> : null}
            </div>
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-900">
              Schnellster Hebel: {text(premiumSummary.fastestWin, "Die wichtigste Massnahme zuerst umsetzen.")}
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_20px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Wirklogik
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">Conversion-Hypothese</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {text(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der naechste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit fuer Anfragen oder Kaeufe steigt.")}
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-slate-950">KI-Einordnung</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die KI-Beratung ordnet die Analyse in eine klare Diagnose ein und macht sichtbar, welche Entscheidung Besucher gerade noch ausbremst.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-slate-950">Was bedeutet das konkret?</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Aus den Befunden wird kein zweiter Bericht, sondern eine Beratungsebene mit Bedeutung, Prioritaet und Formulierungsansaetzen.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-slate-950">Nächste sinnvolle Schritte</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die nächsten Schritte stehen im Fahrplan und in den drei wichtigsten Hebeln direkt unterhalb dieses Premium-Bereichs.
            </p>
          </article>
        </div>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
