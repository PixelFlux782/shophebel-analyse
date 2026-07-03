"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { normalizeGermanReportText } from "@/lib/report/reportCopy";

type PremiumAiReportApiResponse = {
  analysisId?: string;
  source?: "cache" | "generated";
  report?: PremiumAiReport;
  error?: string;
  code?: string;
};

type ReportState = "idle" | "loading" | "success" | "error";

type PremiumAiReportSectionProps = {
  analysisId: string;
  canViewPremium: boolean;
  initialReport?: PremiumAiReport | null;
  initialSource?: "cache" | "generated" | null;
  initialState?: ReportState;
  initialErrorCode?: string | null;
};

const impactLabels = {
  low: "geringe Wirkung",
  medium: "mittlere Wirkung",
  high: "hohe Wirkung",
};

const effortLabels = {
  low: "niedriger Aufwand",
  medium: "mittlerer Aufwand",
  high: "höherer Aufwand",
};

const priorityLabels = {
  now: "Sofort",
  next: "Danach",
  later: "Später",
};

function getErrorMessage(code?: string | null) {
  switch (code) {
    case "premium_access_required":
      return "Diese KI-Beratung ist nur in freigeschalteten Premium-Analysen enthalten.";
    case "invalid_ai_response":
      return "Der KI-Bericht konnte nicht sicher ausgewertet werden. Bitte versuche es später erneut.";
    case "openrouter_key_missing":
      return "Die KI-Beratung ist gerade nicht verfügbar. Bitte versuche es später noch einmal.";
    case "missing_analysis_id":
    case "analysis_not_found":
      return "Die passende Analyse wurde nicht gefunden. Starte die Seite bitte neu oder öffne den Ergebnislink erneut.";
    case "storage_error":
    case "save_failed":
    case "internal_error":
      return "Es gab ein Serverproblem beim Speichern oder Laden des KI-Berichts.";
    case "provider_error":
      return "Der KI-Bericht konnte gerade nicht erzeugt werden. Bitte versuche es in wenigen Minuten erneut.";
    default:
      return "Der KI-Bericht konnte gerade nicht geladen werden. Bitte versuche es erneut.";
  }
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900">
      {children}
    </span>
  );
}

function ImprovementList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-bold text-slate-950">{title}</h4>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item}>{normalizeGermanReportText(item)}</li>
        ))}
      </ul>
    </div>
  );
}

function ReportView({
  report,
  source,
}: {
  report: PremiumAiReport;
  source?: "cache" | "generated" | null;
}) {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_20px_80px_-58px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Kurzüberblick
          </p>
          <p className="mt-3 text-base leading-8 text-slate-700">{normalizeGermanReportText(report.executiveSummary)}</p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_20px_80px_-58px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Hauptdiagnose
          </p>
          <p className="mt-3 text-base leading-8 text-slate-700">{normalizeGermanReportText(report.mainDiagnosis)}</p>
          {source ? (
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {source === "cache" ? "Gespeicherter KI-Bericht" : "Neu erzeugter KI-Bericht"}
            </p>
          ) : null}
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Bewertung erklärt</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{normalizeGermanReportText(report.scoreExplanation)}</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Wichtigste Probleme</h3>
        <div className="mt-4 grid gap-4">
          {report.topIssues.map((issue, index) => (
            <div key={`${issue.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                    Problem {index + 1}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{normalizeGermanReportText(issue.title)}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{impactLabels[issue.impact]}</Badge>
                  <Badge>{effortLabels[issue.effort]}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{normalizeGermanReportText(issue.whyItMatters)}</p>
              <div className="mt-3 rounded-xl border border-white bg-white px-4 py-3">
                <p className="text-sm font-bold text-slate-950">Belege aus der Analyse</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                  {issue.evidence.map((item) => (
                    <li key={item}>{normalizeGermanReportText(item)}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-sm font-bold leading-7 text-slate-950">
                Empfehlung: {normalizeGermanReportText(issue.recommendedAction)}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Maßnahmenplan</h3>
        <ol className="mt-4 grid gap-3">
          {report.actionPlan.map((step) => (
            <li key={`${step.step}-${step.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-950">
                  {step.step}. {normalizeGermanReportText(step.title)}
                </p>
                <Badge>{priorityLabels[step.priority]}</Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-700">{normalizeGermanReportText(step.description)}</p>
            </li>
          ))}
        </ol>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Beispiel-Verbesserungen</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ImprovementList title="Hero" items={report.exampleImprovements.heroTextIdeas} />
          <ImprovementList title="CTA" items={report.exampleImprovements.ctaIdeas} />
          <ImprovementList title="Trust" items={report.exampleImprovements.trustElementIdeas} />
        </div>
      </article>

      <p className="rounded-2xl border border-slate-200 bg-white/75 px-5 py-4 text-xs leading-6 text-slate-500">
        {normalizeGermanReportText(report.disclaimer)}
      </p>
    </div>
  );
}

export function PremiumAiReportSection({
  analysisId,
  canViewPremium,
  initialReport = null,
  initialSource = null,
  initialState,
  initialErrorCode = null,
}: PremiumAiReportSectionProps) {
  const [report, setReport] = useState<PremiumAiReport | null>(initialReport);
  const [source, setSource] = useState<"cache" | "generated" | null>(initialSource);
  const [state, setState] = useState<ReportState>(
    initialState ?? (initialReport ? "success" : "idle"),
  );
  const [errorCode, setErrorCode] = useState<string | null>(initialErrorCode);

  async function generateReport() {
    if (state === "loading" || !canViewPremium) {
      return;
    }

    setState("loading");
    setErrorCode(null);

    try {
      const response = await fetch("/api/premium-ai-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisId }),
      });
      const payload = (await response.json()) as PremiumAiReportApiResponse;

      if (!response.ok || !payload.report) {
        setErrorCode(payload.code ?? "internal_error");
        setState("error");
        return;
      }

      setReport(payload.report);
      setSource(payload.source ?? "generated");
      setState("success");
    } catch {
      setErrorCode("network_error");
      setState("error");
    }
  }

  if (!canViewPremium) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-900 p-6 text-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)] sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">
          KI-Premiumbericht
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Der KI-Beraterbericht ist in Premium enthalten.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Nach dem Premium-Upgrade kannst du den gespeicherten KI-Bericht für diese Analyse erzeugen und erneut lesen.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-[linear-gradient(135deg,_#f0fdfa_0%,_#ffffff_45%,_#eef2ff_100%)] text-slate-950 shadow-[0_36px_140px_-70px_rgba(15,23,42,0.55)]">
      <div className="border-b border-cyan-200/70 bg-slate-950 px-5 py-6 text-white sm:px-7 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
              KI-Beratung
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              KI-Premiumreport
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
              Eine zusätzliche Beratungsebene mit Diagnose, Prioritäten und konkreten Textideen.
            </p>
          </div>

          {!report ? (
            <button
              type="button"
              onClick={generateReport}
              disabled={state === "loading"}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 text-base font-extrabold text-slate-950 shadow-[0_20px_60px_-28px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
            >
              {state === "loading" ? "KI-Bericht wird erstellt ..." : "KI-Premiumreport erzeugen"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:p-8">
        {state === "idle" && !report ? (
          <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
            <h3 className="text-xl font-bold text-slate-950">Bereit zur Erstellung</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
              Der Bericht wird erst erzeugt, wenn du den Button klickst. Falls für diese Analyse bereits ein KI-Bericht gespeichert ist, wird er direkt wiederverwendet.
            </p>
          </div>
        ) : null}

        {state === "loading" ? (
          <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Bericht wird vorbereitet
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-950">
              Die KI-Premiumanalyse wird erstellt.
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Das kann einen Moment dauern. Bitte lasse diese Seite geöffnet; ein zweiter Auftrag wird nicht parallel gestartet.
            </p>
          </div>
        ) : null}

        {state === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950 shadow-[0_18px_70px_-55px_rgba(127,29,29,0.35)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
              KI-Bericht nicht verfügbar
            </p>
            <h3 className="mt-3 text-xl font-bold">Bitte später erneut versuchen</h3>
            <p className="mt-3 text-sm leading-7">{getErrorMessage(errorCode)}</p>
            <button
              type="button"
              onClick={generateReport}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Erneut versuchen
            </button>
          </div>
        ) : null}

        {report ? <ReportView report={report} source={source} /> : null}
      </div>
    </section>
  );
}
