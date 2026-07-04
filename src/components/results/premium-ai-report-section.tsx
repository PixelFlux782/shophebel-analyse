"use client";

import { useState } from "react";

import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { normalizeGermanReportText } from "@/lib/report/reportCopy";

type PremiumAiReportSource = "cache" | "generated" | "fallback";

type PremiumAiReportApiResponse = {
  analysisId?: string;
  source?: PremiumAiReportSource;
  report?: PremiumAiReport;
  error?: string;
  code?: string;
};

type ReportState = "idle" | "loading" | "success" | "error";

type PremiumAiReportSectionProps = {
  analysisId: string;
  canViewPremium: boolean;
  initialReport?: PremiumAiReport | null;
  initialSource?: PremiumAiReportSource | null;
  initialState?: ReportState;
  initialErrorCode?: string | null;
};

function getErrorMessage(code?: string | null) {
  switch (code) {
    case "premium_access_required":
      return "Diese KI-Beratung ist nur in freigeschalteten Premium-Analysen enthalten.";
    case "missing_analysis_id":
    case "analysis_not_found":
      return "Die passende Analyse wurde nicht gefunden. Öffne den Ergebnislink bitte erneut.";
    case "storage_error":
    case "save_failed":
    case "fallback_save_failed":
    case "internal_error":
      return "Es gab ein Serverproblem beim Speichern oder Laden des KI-Berichts.";
    case "network_error":
      return "Die Verbindung wurde unterbrochen. Der Bericht wurde nicht erneut gestartet.";
    default:
      return "Der KI-Bericht konnte gerade nicht geladen werden. Bitte versuche es später erneut.";
  }
}

function leverText(
  lever: PremiumAiReport["topLevers"][number],
  key: "whyItMatters" | "shopObservation" | "improvement" | "expectedEffect" | "difficulty",
) {
  const legacy = lever as unknown as {
    problem?: string;
    businessImpact?: string;
    recommendation?: string;
  };

  if (key === "whyItMatters") return lever.whyItMatters ?? legacy.problem ?? "";
  if (key === "shopObservation") return lever.shopObservation ?? legacy.businessImpact ?? "";
  if (key === "improvement") return lever.improvement ?? legacy.recommendation ?? "";
  if (key === "expectedEffect") return lever.expectedEffect ?? legacy.businessImpact ?? "Qualitativer Effekt ohne Zahlenversprechen.";
  return lever.difficulty ?? "mittel";
}

function ReportView({
  report,
  source,
}: {
  report: PremiumAiReport;
  source?: PremiumAiReportSource | null;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-lg border border-cyan-200 bg-white p-5 shadow-[0_16px_55px_-48px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Management-Fazit
          </p>
          <p className="mt-3 text-base leading-8 text-slate-700">{normalizeGermanReportText(report.executiveSummary)}</p>
        </article>

        <article className="rounded-lg border border-amber-200 bg-white p-5 shadow-[0_16px_55px_-48px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            KI-Einordnung
          </p>
          <p className="mt-3 text-base leading-8 text-slate-700">{normalizeGermanReportText(report.mainDiagnosis)}</p>
          {source && isDevelopment ? (
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {source === "cache"
                ? "Gespeicherter KI-Bericht"
                : source === "fallback"
                  ? "Stabiler Ersatzbericht"
                  : "Neu erzeugter KI-Bericht"}
            </p>
          ) : null}
        </article>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_55px_-48px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Die wichtigsten 3 Hebel</h3>
        <div className="mt-4 grid gap-3">
          {report.topLevers.map((lever, index) => (
            <div key={`${lever.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                    Hebel {index + 1}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{normalizeGermanReportText(lever.title)}</h4>
                </div>
                <p className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  {normalizeGermanReportText(leverText(lever, "difficulty"))}
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm leading-7 text-slate-700">
                  <strong className="text-slate-950">Warum wichtig:</strong> {normalizeGermanReportText(leverText(lever, "whyItMatters"))}
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  <strong className="text-slate-950">Im Shop passiert vermutlich:</strong> {normalizeGermanReportText(leverText(lever, "shopObservation"))}
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  <strong className="text-slate-950">Verbesserung:</strong> {normalizeGermanReportText(leverText(lever, "improvement"))}
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  <strong className="text-slate-950">Erwarteter Effekt:</strong> {normalizeGermanReportText(leverText(lever, "expectedEffect"))}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-white bg-white px-4 py-3 text-sm font-bold leading-7 text-slate-950">
                Erster kleiner Schritt: {normalizeGermanReportText(lever.firstStep)}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-cyan-200 bg-white p-5 shadow-[0_14px_55px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Umsetzung</p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">7-Tage-Fahrplan</h3>
          </div>
          <p className="text-sm font-semibold text-slate-600">Erst Klarheit, dann Umsetzung, dann Kontrolle.</p>
        </div>
        <ol className="mt-5 grid gap-3 lg:grid-cols-3">
          {report.sevenDayPlan.map((step) => (
            <li key={`${step.day}-${step.focus}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                {normalizeGermanReportText(step.day)}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950">
                {normalizeGermanReportText(step.focus)}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                {step.tasks.map((task) => (
                  <li key={task}>{normalizeGermanReportText(task)}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_55px_-48px_rgba(15,23,42,0.45)]">
        <h3 className="text-xl font-bold text-slate-950">Fazit für Inhaber</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{normalizeGermanReportText(report.ownerConclusion)}</p>
      </article>

      {source === "fallback" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-6 text-amber-900">
          Die Beratung wurde aus den vorhandenen Analyse-Daten als Ersatzbericht erstellt, weil der KI-Provider gerade nicht stabil geantwortet hat.
        </p>
      ) : null}
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
  const [source, setSource] = useState<PremiumAiReportSource | null>(initialSource);
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
          KI-Beratung
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Die KI-Einordnung ist in Premium enthalten.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Nach dem Premium-Upgrade kannst du den gespeicherten KI-Bericht für diese Analyse erzeugen und erneut lesen.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white text-slate-950 shadow-[0_20px_80px_-62px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
              KI-Beratung
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Premium-KI-Beratung
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Diagnose, die drei wichtigsten Hebel und ein umsetzbarer 7-Tage-Fahrplan aus den Analyse-Daten.
            </p>
          </div>

          {!report ? (
            <button
              type="button"
              onClick={generateReport}
              disabled={state === "loading"}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {state === "loading" ? "KI-Beratung wird erstellt ..." : "KI-Einordnung erzeugen"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-slate-50/70 p-5 sm:p-6">
        {state === "idle" && !report ? (
          <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.45)]">
            <h3 className="text-xl font-bold text-slate-950">Bereit zur Erstellung</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
              Der Bericht wird erst erzeugt, wenn du den Button klickst. Falls für diese Analyse bereits ein aktueller KI-Bericht gespeichert ist, wird er direkt wiederverwendet.
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
              disabled={false}
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
