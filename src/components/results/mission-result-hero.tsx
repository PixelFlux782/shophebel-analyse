import Link from "next/link";

import { CheckoutButton } from "@/components/CheckoutButton";
import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";
import { ScoreCountUp } from "@/components/results/score-count-up";
import type { AnalysisPlan } from "@/lib/premium/premiumAccess";
import { getOverallStatusLabel, getScoreTone } from "@/lib/result-ui";
import type { AnalysisCategory, AnalysisResult, Finding, PriorityLevel } from "@/types/analysis";

interface MissionResultHeroProps {
  analysisId: string;
  result: AnalysisResult;
  plan: AnalysisPlan;
  canViewFull: boolean;
  canViewPremium: boolean;
  isPaymentProcessing: boolean;
}

type SubscoreKey = "conversion" | "trust" | "ux" | "mobile" | "seo" | "aiVisibility";

interface Subscore {
  key: SubscoreKey;
  label: string;
  score: number;
  hint: string;
  locked?: boolean;
}

function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryScore(result: AnalysisResult, category: AnalysisCategory, fallback: number) {
  const categoryBlock =
    category === "ux" ? undefined : result.categories?.[category as keyof AnalysisResult["categories"]];

  return clampScore(
    result.categoryScores?.[category]?.score ?? categoryBlock?.score,
    fallback,
  );
}

function scoreHint(score: number, label: string) {
  if (score >= 82) return `${label} gut eingeordnet`;
  if (score >= 68) return `${label} erkennbar, Reibung pruefen`;
  if (score >= 52) return `${label} unter dem empfohlenen Bereich`;
  return `${label} braucht sofort Fokus`;
}

function formatDate(value?: string) {
  if (!value) return "Abgeschlossen";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Abgeschlossen";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || value;
  }
}

function modeLabel(mode: AnalysisResult["analysisMode"]) {
  return mode === "rendered" ? "Live-Ansicht geprüft" : "Statische Ansicht geprüft";
}

function reportLevel(plan: AnalysisPlan) {
  if (plan === "premium") return "Premium";
  if (plan === "full") return "Vollanalyse";
  return "Kostenlos";
}

function scoreInterpretation(result: AnalysisResult, subscores: Subscore[]) {
  const overall = clampScore(result.overallScore, 0);
  const weakest = [...subscores].sort((left, right) => left.score - right.score)[0];
  const conversion = subscores.find((item) => item.key === "conversion")?.score ?? overall;
  const trust = subscores.find((item) => item.key === "trust")?.score ?? overall;
  const ai = subscores.find((item) => item.key === "aiVisibility")?.score ?? overall;

  if (overall >= 82) {
    return ai < 70
      ? "Starke Website-Basis, aber KI-lesbare Struktur limitiert die nächste Sichtbarkeitsebene."
      : "Starke digitale Basis mit klarer Führung und belastbaren Vertrauenssignalen.";
  }

  if (overall >= 68) {
    if (conversion < 65) return "Solide Grundlage, aber klare Anfrage-Reibung im sichtbaren Startbereich.";
    if (trust < 65) return "Starke visuelle Basis, aber Vertrauen und Button-Klarheit bremsen den ersten Eindruck.";
    return `${weakest?.label ?? "Ein Kernbereich"} zieht den Gesamteindruck noch unter Premium-Niveau.`;
  }

  if (overall >= 50) {
    return "Technisch erreichbar, strategisch aber noch nicht vollständig verkaufsstark.";
  }

  return "Die Seite sendet noch zu wenige klare Signale für Vertrauen, Handlung und maschinenlesbare Relevanz.";
}

function buildSubscores(result: AnalysisResult, canViewFull: boolean): Subscore[] {
  const overall = clampScore(result.overallScore, 60);
  const conversion = categoryScore(result, "conversion", overall);
  const trust = categoryScore(result, "trust", overall);
  const ux = categoryScore(result, "ux", categoryScore(result, "design", overall));
  const performance = categoryScore(result, "performance", overall);
  const design = categoryScore(result, "design", ux);
  const mobile = Math.round((performance + design) / 2);
  const seo = categoryScore(result, "seo", overall);
  const aiVisibility = categoryScore(result, "aiVisibility", Math.round((seo + overall) / 2));

  const items: Subscore[] = [
    { key: "conversion", label: "Anfrageklarheit", score: conversion, hint: scoreHint(conversion, "Handlungsweg") },
    { key: "trust", label: "Vertrauen", score: trust, hint: scoreHint(trust, "Vertrauensebene") },
    { key: "ux", label: "UX-Klarheit", score: ux, hint: scoreHint(ux, "Hierarchie") },
    { key: "mobile", label: "Mobile", score: mobile, hint: scoreHint(mobile, "Mobile Ansicht") },
    { key: "seo", label: "SEO", score: seo, hint: scoreHint(seo, "Suchsignale") },
    { key: "aiVisibility", label: "KI-Sichtbarkeit", score: aiVisibility, hint: scoreHint(aiVisibility, "Entitätssignale") },
  ];

  return canViewFull ? items : items.slice(0, 3).map((item, index) => ({ ...item, locked: index > 1 }));
}

function findingWeight(finding: Finding) {
  const priority: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };
  const status = { error: 0, warning: 1, success: 2 };

  return priority[finding.priority] * 10 + status[finding.status];
}

function normalizeSignal(text: string) {
  return text.trim().replace(/\.$/, "");
}

function fallbackSignals(subscores: Subscore[]) {
  const weakest = [...subscores].sort((left, right) => left.score - right.score);
  const templates: Record<SubscoreKey, string> = {
    conversion: "Der Button-Fokus konkurriert mit visueller Unruhe",
    trust: "Vertrauenssignale erscheinen zu spät",
    ux: "Die Startbotschaft zeigt den Geschäftsnutzen nicht sofort",
    mobile: "Mobile Hierarchie braucht mehr Verdichtung",
    seo: "Suchintentionen sind noch nicht vollständig getroffen",
    aiVisibility: "KI-lesbare Entitätsstruktur ist unvollständig",
  };

  return weakest.slice(0, 3).map((item) => templates[item.key]);
}

function criticalSignals(result: AnalysisResult, subscores: Subscore[], canViewFull: boolean) {
  const findings = [...(result.findings ?? [])]
    .filter((finding) => finding.status !== "success")
    .sort((left, right) => findingWeight(left) - findingWeight(right))
    .map((finding) => normalizeSignal(finding.title))
    .filter(Boolean);

  const recommendations = [...(result.recommendations ?? [])]
    .sort((left, right) => {
      const priority: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };
      return priority[left.impact] - priority[right.impact];
    })
    .map((recommendation) => normalizeSignal(recommendation.title))
    .filter(Boolean);

  const unique = Array.from(new Set([...findings, ...recommendations, ...fallbackSignals(subscores)]));
  return unique.slice(0, canViewFull ? 3 : 2);
}

function businessImpact(subscores: Subscore[]) {
  const low = new Set(subscores.filter((item) => item.score < 70).map((item) => item.key));
  const items = [
    low.has("conversion") ? "Anfrageklarheit unter dem optimalen Bereich" : "Primärer Handlungsweg lesbar",
    low.has("trust") ? "Vertrauensreibung erkannt" : "Vertrauensbasis sichtbar",
    low.has("mobile") || low.has("ux") ? "Wahrscheinlicher Aufmerksamkeitsverlust im ersten Sichtbereich" : "Oberflächenhierarchie weitgehend stabil",
    low.has("aiVisibility") || low.has("seo") ? "KI-Sichtbarkeit teilweise limitiert" : "Such- und KI-Signale abgestimmt",
  ];

  return items.slice(0, 4);
}

function lockedLayerCopy(plan: AnalysisPlan) {
  if (plan === "premium") {
    return {
      title: "Strategischer Bericht freigeschaltet",
      items: ["Priorisierte Empfehlungen aktiv", "KI-Beratung aktiv", "7-Tage-Fahrplan aktiv"],
    };
  }

  if (plan === "full") {
    return {
      title: "Strategische Beratungsebene gesperrt",
      items: ["Premium-Bericht verfügbar", "Priorisierte Empfehlungen", "7-Tage-Fahrplan"],
    };
  }

  return {
    title: "3 tiefere Analyseebenen gesperrt",
    items: ["Vollständige visuelle Analyse verfügbar", "Umsatzwirkung verfügbar", "Kategorieauswertung verfügbar"],
  };
}

export function MissionResultHero({
  analysisId,
  result,
  plan,
  canViewFull,
  canViewPremium,
  isPaymentProcessing,
}: MissionResultHeroProps) {
  const overall = clampScore(result.overallScore, 0);
  const tone = getScoreTone(overall);
  const subscores = buildSubscores(result, canViewFull);
  const signals = criticalSignals(result, subscores, canViewFull);
  const impacts = businessImpact(subscores);
  const locked = lockedLayerCopy(plan);

  return (
    <section className="overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white text-slate-950 shadow-[0_34px_110px_-70px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-[#fbfaf7] px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Analyse abgeschlossen
            </span>
            <span className="break-all rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {getDomain(result.finalUrl ?? result.url)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {modeLabel(result.analysisMode)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span>{formatDate(result.scannedAt ?? result.createdAt)}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>{reportLevel(plan)}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>Visuelle Prüfung, Nutzerführung, Auffindbarkeit und KI-Sichtbarkeit eingeordnet</span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(28rem,1.05fr)]">
        <div className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Shophebel-Analysebericht
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
            <div className="rounded-[1rem] border border-slate-200 bg-[#f9f6ef] p-4 shadow-inner">
              <div className="flex items-end gap-2">
                <div className="font-mono text-6xl font-semibold leading-none tracking-normal text-slate-950">
                  <ScoreCountUp value={overall} />
                </div>
                <div className="pb-1 font-mono text-xl font-semibold text-slate-400">/100</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full ${tone.progress}`}
                  style={{ width: `${Math.max(8, overall)}%` }}
                />
              </div>
              <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${tone.badge}`}>
                {getOverallStatusLabel(overall)}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Shophebel-Analysewert
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {scoreInterpretation(result, subscores)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Wichtigste 3 Signale
              </h2>
              <span className="text-xs font-medium text-slate-500">{signals.length} priorisiert</span>
            </div>
            <ol className="mt-4 grid gap-3">
              {signals.map((signal, index) => (
                <li key={signal} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-slate-700">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-[#f9f6ef] font-mono text-xs font-semibold text-slate-900">
                    {index + 1}
                  </span>
                  <span>{signal}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="grid gap-5 bg-[#fbfaf7] p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {subscores.map((item) => {
              const itemTone = getScoreTone(item.score);

              return (
                <article
                  key={item.key}
                  className={`min-h-[7.5rem] rounded-[0.85rem] border bg-white p-4 shadow-[0_16px_60px_-50px_rgba(15,23,42,0.45)] ${item.locked ? "border-slate-200 opacity-70" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.locked ? "Tiefere Ebene gesperrt" : item.hint}</p>
                    </div>
                    <span className="font-mono text-xl font-semibold text-slate-950">{item.score}</span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${item.locked ? "bg-slate-500" : itemTone.progress}`}
                      style={{ width: `${Math.max(8, item.score)}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.85fr)]">
            <div className="rounded-[0.9rem] border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Geschäftliche Lesart</p>
              <div className="mt-4 space-y-2">
                {impacts.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[0.9rem] border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-sm font-semibold">{locked.title}</p>
              <div className="mt-4 space-y-2">
                {locked.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${canViewPremium ? "bg-emerald-300" : "bg-cyan-300/70"}`} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5">
                {isPaymentProcessing ? (
                  <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                    Zahlung wird verarbeitet. Die Freischaltung kann einen Moment dauern.
                  </p>
                ) : canViewPremium ? (
                  <Link
                    href={`/api/premium-report/${encodeURIComponent(analysisId)}/pdf`}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-200"
                  >
                    Premium-PDF herunterladen
                  </Link>
                ) : canViewFull ? (
                  <PremiumReportRequestButton
                    analysisId={analysisId}
                    url={result.url}
                    label="49 EUR Premium-Bericht"
                    className="w-full rounded-lg px-4 py-3 text-sm"
                  />
                ) : (
                  <CheckoutButton
                    analysisId={analysisId}
                    label="5 EUR Vollanalyse"
                    className="w-full justify-center rounded-lg bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
