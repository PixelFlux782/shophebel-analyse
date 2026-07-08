import Link from "next/link";
import type { ReactNode } from "react";

import { PremiumReport } from "@/lib/premium/buildPremiumReport";
import { polishPremiumText } from "@/lib/premium/premiumCopy";
import type { PremiumWebsiteAnalysis } from "@/lib/premium/premiumWebsiteAnalysis";

type PremiumReportSectionReport = Partial<PremiumReport> & {
  premiumSummary?: Partial<PremiumReport["premiumSummary"]>;
};

function text(value: unknown, fallback = "Für diesen Punkt liegt noch keine separate Kundenangabe vor.") {
  return polishPremiumText(value, fallback);
}

function scoreText(score: unknown) {
  return typeof score === "number" && Number.isFinite(score) ? `${Math.round(score)}/100` : "offen";
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    home: "Startseite",
    offer: "Angebot",
    product: "Produkt/Shop",
    trust: "Vertrauen",
    contact: "Kontakt",
    faq: "FAQ",
    pricing: "Preise",
    unknown: "Unterseite",
  };

  return labels[role] ?? role;
}

function WebsiteSystemView({ websiteAnalysis }: { websiteAnalysis: PremiumWebsiteAnalysis }) {
  return (
    <div className="mt-8 space-y-7 border-t border-slate-300 pt-7">
      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9fd3c7]">Website-Gesamturteil</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight">{scoreText(websiteAnalysis.overallWebsiteScore)}</p>
          <p className="mt-4 text-sm leading-7 text-slate-200">{text(websiteAnalysis.crossPageDiagnosis)}</p>
          {websiteAnalysis.fallbackNote ? (
            <p className="mt-4 border-t border-white/15 pt-4 text-xs leading-6 text-slate-300">
              {text(websiteAnalysis.fallbackNote)}
            </p>
          ) : null}
        </article>

        <article className="border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">Seitenübersicht</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Seite</th>
                  <th className="px-3 py-2">Rolle</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Hauptproblem</th>
                  <th className="py-2 pl-3">Hebel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {websiteAnalysis.pages.map((page) => (
                  <tr key={`${page.role}-${page.url}`} className="align-top">
                    <td className="py-3 pr-3 font-semibold text-slate-950">{text(page.label, "Seite")}</td>
                    <td className="px-3 py-3 text-slate-600">{roleLabel(page.role)}</td>
                    <td className="px-3 py-3 font-bold text-slate-950">{scoreText(page.score)}</td>
                    <td className="px-3 py-3 text-slate-700">{text(page.problems[0], "Kein Hauptproblem gespeichert.")}</td>
                    <td className="py-3 pl-3 text-slate-700">{text(page.recommendation, "Wichtigsten Hebel priorisieren.")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">Website-weite Muster</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {[
            ["Wiederkehrende Probleme", websiteAnalysis.repeatedProblems.length ? websiteAnalysis.repeatedProblems : ["Keine wiederkehrenden Probleme über mehrere Seiten erkannt."]],
            ["Vertrauen und Angebot", [websiteAnalysis.trustConsistencyAssessment, websiteAnalysis.conversionPathAssessment]],
            ["Nutzerführung", [websiteAnalysis.navigationAssessment]],
          ].map(([title, items]) => (
            <article key={String(title)} className="border-t border-slate-300 pt-4">
              <h3 className="text-base font-bold text-slate-950">{String(title)}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                {(items as string[]).map((item) => (
                  <li key={item}>{text(item)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">Einzelanalysen</p>
        <div className="mt-4 space-y-3">
          {websiteAnalysis.pages.map((page, index) => (
            <details key={`${page.url}-details`} className="border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="cursor-pointer text-base font-bold text-slate-950">
                {text(page.label, "Seite")} · {roleLabel(page.role)} · {scoreText(page.score)}
              </summary>
              <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]">
                <div className="overflow-hidden border border-slate-200 bg-slate-100">
                  {page.screenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={page.screenshot} alt="" className="h-44 w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-44 items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Kein Screenshot verfügbar
                    </div>
                  )}
                </div>
                <div className="grid gap-3 text-sm leading-7 text-slate-700">
                  <p><strong className="text-slate-950">Kurzdiagnose:</strong> {text(page.shortDiagnosis)}</p>
                  <p><strong className="text-slate-950">Stärken:</strong> {page.strengths.length ? page.strengths.map((item) => text(item)).join(" · ") : "Keine separaten Stärken gespeichert."}</p>
                  <p><strong className="text-slate-950">Probleme:</strong> {page.problems.length ? page.problems.map((item) => text(item)).join(" · ") : "Keine separaten Probleme gespeichert."}</p>
                  <p><strong className="text-slate-950">Empfehlung:</strong> {text(page.recommendation)}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="border border-[#bfe5d3] bg-[#edf8f3] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">Priorisierter 7-Tage-Plan</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {websiteAnalysis.sevenDayPlan.map((step) => (
            <article key={step.days} className="bg-white p-4">
              <h3 className="text-sm font-bold text-slate-950">{text(step.days)}: {text(step.focus)}</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                {step.actions.map((action) => (
                  <li key={action}>{text(action)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
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
      className="scroll-mt-28 overflow-hidden border border-[#2c3a38] bg-[#151918] text-[#f4fbf7] shadow-[0_42px_150px_-74px_rgba(15,23,42,0.78)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="px-5 py-8 sm:px-7 lg:px-10 lg:py-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9fd3c7]">
            Premium freigeschaltet
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Premium-Bericht inkl. KI-Beratung
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#c8d8d3]">
            Ein eigenständiger Arbeitsbericht für Priorität, Entscheidung und Umsetzung:
            ruhig lesbar, als PDF nutzbar und durch KI-Beratung direkt verdichtet.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-5">
            {includedItems.map((item, index) => (
              <div key={item} className="border-t border-[#9fd3c7]/35 pt-3">
                <span className="font-mono text-sm text-[#9fd3c7]">0{index + 1}</span>
                <p className="mt-2 text-sm font-semibold text-[#fff8ed]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-t border-[#9fd3c7]/20 bg-[#1d2423] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9fd3c7]">
            Berichtszugang
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            PDF plus KI-Einordnung
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#c8d8d3]">
            Der Download ist der statische Bericht. Die KI-Beratung darunter macht daraus
            Diagnose, Reihenfolge und konkrete Umsetzungsideen.
          </p>
          {pdfHref ? (
            <Link
              href={pdfHref}
              className="mt-6 inline-flex w-full items-center justify-center bg-[#d8f2ea] px-5 py-3 text-sm font-bold text-[#111817] transition hover:bg-[#e9fff8]"
            >
              PDF-Bericht herunterladen
            </Link>
          ) : null}
        </aside>
      </div>

      <div className="border-t border-[#9fd3c7]/20 bg-[#fff8ed] p-5 text-slate-950 sm:p-7 lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.58fr)]">
          <article className="border-l-4 border-[#3f9c8a] pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">
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
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">
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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f7668]">
            Conversion-Hypothese
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            {text(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.")}
          </p>
        </article>

        {report.websiteAnalysis ? <WebsiteSystemView websiteAnalysis={report.websiteAnalysis} /> : null}

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
