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
    "KI-Beratung",
    "wichtigste 3 Hebel",
    "7-Tage-Fahrplan",
    "PDF-Bericht",
    "Umsetzungsempfehlungen",
  ];

  return (
    <section
      data-component="PremiumReportSection"
      className="overflow-hidden border border-[#2b2118] bg-[#18130f] text-[#fff8ed] shadow-[0_42px_150px_-74px_rgba(24,19,15,0.88)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="px-5 py-8 sm:px-7 lg:px-10 lg:py-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9b36f]">
            Premium freigeschaltet
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Premium-Bericht inkl. KI-Beratung
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#d8c7b3]">
            Ein eigenständiger Arbeitsbericht für Priorität, Entscheidung und Umsetzung:
            ruhig lesbar, als PDF nutzbar und durch KI-Beratung direkt verdichtet.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-5">
            {includedItems.map((item, index) => (
              <div key={item} className="border-t border-[#d9b36f]/35 pt-3">
                <span className="font-mono text-sm text-[#d9b36f]">0{index + 1}</span>
                <p className="mt-2 text-sm font-semibold text-[#fff8ed]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-t border-[#d9b36f]/20 bg-[#241b14] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d9b36f]">
            Berichtszugang
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            PDF plus KI-Einordnung
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#d8c7b3]">
            Der Download ist der statische Bericht. Die KI-Beratung darunter macht daraus
            Diagnose, Reihenfolge und konkrete Umsetzungsideen.
          </p>
          {pdfHref ? (
            <Link
              href={pdfHref}
              className="mt-6 inline-flex w-full items-center justify-center bg-[#f4d28c] px-5 py-3 text-sm font-bold text-[#18130f] transition hover:bg-[#ffe1a3]"
            >
              PDF-Bericht herunterladen
            </Link>
          ) : null}
        </aside>
      </div>

      <div className="border-t border-[#d9b36f]/20 bg-[#fff8ed] p-5 text-slate-950 sm:p-7 lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.58fr)]">
          <article className="border-l-4 border-[#b07a2b] pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a1f]">
              Kurzüberblick
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">
              {text(premiumSummary.headline, "Premium Anfrage- und Vertrauens-Audit")}
            </h3>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-700">
              <p>{text(premiumSummary.mainReason, "Der Premium-Bericht fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen.")}</p>
              {premiumSummary.firstFocus ? <p>{text(premiumSummary.firstFocus)}</p> : null}
              {premiumSummary.businessRelevance ? <p>{text(premiumSummary.businessRelevance)}</p> : null}
            </div>
          </article>

          <article className="bg-white p-5 shadow-[0_18px_70px_-58px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a1f]">
              Schnellster Hebel
            </p>
            <p className="mt-3 text-lg font-semibold leading-7 text-slate-950">
              {text(premiumSummary.fastestWin, "Die wichtigste Massnahme zuerst umsetzen.")}
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="border-t border-slate-300 pt-4">
            <h3 className="text-base font-bold text-slate-950">KI-Einordnung</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die Beratung ordnet Score und Befunde in eine klare Diagnose ein.
            </p>
          </article>
          <article className="border-t border-slate-300 pt-4">
            <h3 className="text-base font-bold text-slate-950">Wichtigste 3 Hebel</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Die größten Bremsen werden nach Wirkung und Reihenfolge sortiert.
            </p>
          </article>
          <article className="border-t border-slate-300 pt-4">
            <h3 className="text-base font-bold text-slate-950">7-Tage-Fahrplan und PDF</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Der Bericht bleibt als PDF greifbar und wird als Arbeitsplan fortgesetzt.
            </p>
          </article>
        </div>

        <article className="mt-8 border-t border-slate-300 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a1f]">
            Conversion-Hypothese
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            {text(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.")}
          </p>
        </article>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
