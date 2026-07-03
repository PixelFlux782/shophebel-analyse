import Link from "next/link";
import type { ReactNode } from "react";

import { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { polishPremiumText } from "@/lib/premium/premiumCopy";

type PremiumReportSectionReport = Partial<PremiumReport> & {
  premiumSummary?: Partial<PremiumReport["premiumSummary"]>;
};

function text(value: unknown, fallback = "Für diesen Punkt liegt noch keine separate Kundenangabe vor.") {
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
  const includedItems = [
    "KI-Einordnung",
    "wichtigste 3 Hebel",
    "7-Tage-Fahrplan",
    "PDF-Bericht",
    "konkrete Umsetzungsempfehlungen",
  ];

  return (
    <section className="overflow-hidden rounded-[1.15rem] border border-slate-900 bg-slate-950 text-white shadow-[0_42px_150px_-74px_rgba(15,23,42,0.85)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
        <div className="px-5 py-7 sm:px-7 lg:px-8 lg:py-9">
          <p className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-100">
            Premium freigeschaltet
          </p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Premium-Bericht inkl. KI-Beratung
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            Der strategische Teil dieser Analyse: priorisierte Diagnose, KI-Einordnung,
            7-Tage-Fahrplan und PDF als ruhiger Arbeitsbericht.
          </p>

          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            {includedItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Berichtszugang
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Als PDF und als KI-Beratung nutzbar
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Der Download ist der statische Bericht. Die KI-Beratung darunter verdichtet
              ihn in Diagnose, Priorität und konkrete Umsetzungsideen.
            </p>
            {pdfHref ? (
              <Link
                href={pdfHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                PDF-Bericht herunterladen
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#fbfaf7] p-5 text-slate-950 sm:p-7 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[1rem] border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-58px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Kurzüberblick
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              {text(premiumSummary.headline, "Premium Anfrage- und Vertrauens-Audit")}
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>{text(premiumSummary.mainReason, "Der Premium-Bericht fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen.")}</p>
              {premiumSummary.firstFocus ? <p>{text(premiumSummary.firstFocus)}</p> : null}
              {premiumSummary.businessRelevance ? <p>{text(premiumSummary.businessRelevance)}</p> : null}
            </div>
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-900">
              Schnellster Hebel: {text(premiumSummary.fastestWin, "Die wichtigste Maßnahme zuerst umsetzen.")}
            </p>
          </article>

          <article className="rounded-[1rem] border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-58px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Wirklogik
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              Conversion-Hypothese
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {text(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.")}
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <article className="rounded-[0.9rem] border border-slate-200 bg-white p-4">
            <h3 className="text-base font-bold text-slate-950">KI-Einordnung</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die KI-Beratung ordnet die Analyse in eine klare Diagnose ein und macht
              sichtbar, welche Entscheidung Besucher gerade noch ausbremst.
            </p>
          </article>
          <article className="rounded-[0.9rem] border border-slate-200 bg-white p-4">
            <h3 className="text-base font-bold text-slate-950">Wichtigste 3 Hebel</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Aus den Befunden wird eine Beratungsebene mit Bedeutung, Priorität und
              konkreten Formulierungsansätzen.
            </p>
          </article>
          <article className="rounded-[0.9rem] border border-slate-200 bg-white p-4">
            <h3 className="text-base font-bold text-slate-950">7-Tage-Fahrplan und PDF</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die nächsten Schritte stehen im Fahrplan und im PDF-Bericht als umsetzbare
              Reihenfolge.
            </p>
          </article>
        </div>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
