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
  locked?: boolean;
}

function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryScore(result: AnalysisResult, category: AnalysisCategory, fallback: number) {
  const categoryBlock =
    category === "ux" ? undefined : result.categories?.[category as keyof AnalysisResult["categories"]];

  return clampScore(result.categoryScores?.[category]?.score ?? categoryBlock?.score, fallback);
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
  return mode === "rendered" ? "Live-Ansicht geprueft" : "Statische Ansicht geprueft";
}

function reportLevel(plan: AnalysisPlan) {
  if (plan === "premium") return "Premium";
  if (plan === "full") return "Vollanalyse";
  return "Kostenlos";
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
    { key: "conversion", label: "Anfrageklarheit", score: conversion },
    { key: "trust", label: "Vertrauen", score: trust },
    { key: "ux", label: "UX-Klarheit", score: ux },
    { key: "mobile", label: "Mobile", score: mobile },
    { key: "seo", label: "SEO", score: seo },
    { key: "aiVisibility", label: "KI-Sichtbarkeit", score: aiVisibility },
  ];

  return canViewFull ? items : items.slice(0, 3).map((item, index) => ({ ...item, locked: index > 1 }));
}

function scoreInterpretation(result: AnalysisResult, subscores: Subscore[]) {
  const overall = clampScore(result.overallScore, 0);
  const weakest = [...subscores].sort((left, right) => left.score - right.score)[0];
  const conversion = subscores.find((item) => item.key === "conversion")?.score ?? overall;
  const trust = subscores.find((item) => item.key === "trust")?.score ?? overall;
  const ai = subscores.find((item) => item.key === "aiVisibility")?.score ?? overall;

  if (overall >= 82) {
    return ai < 70
      ? "Starke Website-Basis, aber KI-lesbare Struktur limitiert die naechste Sichtbarkeitsebene."
      : "Starke digitale Basis mit klarer Fuehrung und belastbaren Vertrauenssignalen.";
  }

  if (overall >= 68) {
    if (conversion < 65) return "Solide Grundlage, aber klare Anfrage-Reibung im sichtbaren Startbereich.";
    if (trust < 65) return "Starke visuelle Basis, aber Vertrauen und Button-Klarheit bremsen den ersten Eindruck.";
    return `${weakest?.label ?? "Ein Kernbereich"} zieht den Gesamteindruck noch unter Premium-Niveau.`;
  }

  if (overall >= 50) {
    return "Technisch erreichbar, strategisch aber noch nicht vollstaendig verkaufsstark.";
  }

  return "Die Seite sendet noch zu wenige klare Signale fuer Vertrauen, Handlung und maschinenlesbare Relevanz.";
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
    trust: "Vertrauenssignale erscheinen zu spaet",
    ux: "Die Startbotschaft zeigt den Geschaeftsnutzen nicht sofort",
    mobile: "Mobile Hierarchie braucht mehr Verdichtung",
    seo: "Suchintentionen sind noch nicht vollstaendig getroffen",
    aiVisibility: "KI-lesbare Entitaetsstruktur ist unvollstaendig",
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

  return Array.from(new Set([...findings, ...recommendations, ...fallbackSignals(subscores)]))
    .slice(0, canViewFull ? 3 : 2);
}

function businessImpact(subscores: Subscore[]) {
  const low = new Set(subscores.filter((item) => item.score < 70).map((item) => item.key));

  return [
    low.has("conversion") ? "Anfrageklarheit unter dem optimalen Bereich" : "Primaerer Handlungsweg lesbar",
    low.has("trust") ? "Vertrauensreibung erkannt" : "Vertrauensbasis sichtbar",
    low.has("mobile") || low.has("ux") ? "Wahrscheinlicher Aufmerksamkeitsverlust im ersten Sichtbereich" : "Oberflaechenhierarchie weitgehend stabil",
    low.has("aiVisibility") || low.has("seo") ? "KI-Sichtbarkeit teilweise limitiert" : "Such- und KI-Signale abgestimmt",
  ];
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
      items: ["Premium-Bericht verfuegbar", "Priorisierte Empfehlungen", "7-Tage-Fahrplan"],
    };
  }

  return {
    title: "3 tiefere Analyseebenen gesperrt",
    items: ["Vollstaendige visuelle Analyse verfuegbar", "Umsatzwirkung verfuegbar", "Kategorieauswertung verfuegbar"],
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
    <section
      data-component="MissionResultHero"
      className="overflow-hidden border border-slate-200 bg-[#fffdf8] text-slate-950 shadow-[0_28px_120px_-82px_rgba(15,23,42,0.5)]"
    >
      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 lg:block lg:space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Analyse abgeschlossen
            </span>
            <span className="inline-flex break-all rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {getDomain(result.finalUrl ?? result.url)}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {reportLevel(plan)}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Analysewert
            </p>
            <div className="mt-3 flex items-end gap-2">
              <div className="font-mono text-7xl font-semibold leading-none tracking-normal text-slate-950">
                <ScoreCountUp value={overall} />
              </div>
              <div className="pb-2 font-mono text-2xl font-semibold text-slate-400">/100</div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${tone.progress}`}
                style={{ width: `${Math.max(8, overall)}%` }}
              />
            </div>
            <span className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${tone.badge}`}>
              {getOverallStatusLabel(overall)}
            </span>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <p>{formatDate(result.scannedAt ?? result.createdAt)}</p>
            <p className="mt-2">{modeLabel(result.analysisMode)}</p>
          </div>
        </aside>

        <div className="px-5 py-6 sm:px-7 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Shophebel Report
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Diagnose und Top-Hebel fuer diese Seite
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                {scoreInterpretation(result, subscores)}
              </p>

              <ol className="mt-7 grid gap-3">
                {signals.map((signal, index) => (
                  <li
                    key={signal}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-slate-200 pt-4 text-base leading-7 text-slate-700"
                  >
                    <span className="font-mono text-2xl font-semibold text-slate-950">
                      0{index + 1}
                    </span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">Geschaeftliche Lesart</p>
                <div className="mt-4 grid gap-3">
                  {impacts.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <p className="text-sm font-semibold">{locked.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {locked.items.map((item) => (
                    <span key={item} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  {isPaymentProcessing ? (
                    <p className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Zahlung wird verarbeitet. Die Freischaltung kann einen Moment dauern.
                    </p>
                  ) : canViewPremium ? (
                    <Link
                      href={`/api/premium-report/${encodeURIComponent(analysisId)}/pdf`}
                      className="inline-flex w-full items-center justify-center bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      Premium-PDF herunterladen
                    </Link>
                  ) : canViewFull ? (
                    <PremiumReportRequestButton
                      analysisId={analysisId}
                      url={result.url}
                      label="49 EUR Premium-Bericht"
                      className="w-full !rounded-none !bg-emerald-700 px-4 py-3 text-sm !text-white hover:!bg-emerald-800"
                    />
                  ) : (
                    <CheckoutButton
                      analysisId={analysisId}
                      label="5 EUR Vollanalyse"
                      className="w-full justify-center !rounded-none !bg-slate-950 px-4 py-3 text-sm font-bold !text-white hover:!bg-slate-800"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-2 border-t border-slate-200 pt-5 md:grid-cols-3 xl:grid-cols-6">
            {subscores.map((item) => {
              const itemTone = getScoreTone(item.score);

              return (
                <div key={item.key} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-slate-700">{item.label}</span>
                    <span className="font-mono font-semibold text-slate-950">{item.score}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${item.locked ? "bg-slate-400" : itemTone.progress}`}
                      style={{ width: `${Math.max(8, item.score)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
