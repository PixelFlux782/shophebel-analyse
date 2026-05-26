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
  if (score >= 82) return `${label} calibrated`;
  if (score >= 68) return `${label} stable, watch friction`;
  if (score >= 52) return `${label} below optimal range`;
  return `${label} needs immediate focus`;
}

function formatDate(value?: string) {
  if (!value) return "Completed";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Completed";

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
  return mode === "rendered" ? "Rendered live scan" : "Static intelligence scan";
}

function reportLevel(plan: AnalysisPlan) {
  if (plan === "premium") return "Premium";
  if (plan === "full") return "Full";
  return "Free";
}

function scoreInterpretation(result: AnalysisResult, subscores: Subscore[]) {
  const overall = clampScore(result.overallScore, 0);
  const weakest = [...subscores].sort((left, right) => left.score - right.score)[0];
  const conversion = subscores.find((item) => item.key === "conversion")?.score ?? overall;
  const trust = subscores.find((item) => item.key === "trust")?.score ?? overall;
  const ai = subscores.find((item) => item.key === "aiVisibility")?.score ?? overall;

  if (overall >= 82) {
    return ai < 70
      ? "Starke Website-Basis, aber AI-readable Struktur limitiert die naechste Sichtbarkeitsebene."
      : "Starke digitale Basis mit klarer Fuehrung und belastbaren Trust-Signalen.";
  }

  if (overall >= 68) {
    if (conversion < 65) return "Solide Grundlage, aber klare Conversion-Reibung oberhalb des Folds.";
    if (trust < 65) return "Starke visuelle Basis, aber Trust- und CTA-Klarheit bremsen den ersten Eindruck.";
    return `${weakest?.label ?? "Ein Kernbereich"} zieht den Gesamteindruck noch unter Premium-Niveau.`;
  }

  if (overall >= 50) {
    return "Technisch erreichbar, strategisch aber noch nicht vollstaendig verkaufsstark.";
  }

  return "Die Seite sendet noch zu wenige klare Signale fuer Vertrauen, Handlung und maschinenlesbare Relevanz.";
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
    { key: "conversion", label: "Conversion", score: conversion, hint: scoreHint(conversion, "CTA path") },
    { key: "trust", label: "Trust", score: trust, hint: scoreHint(trust, "Trust layer") },
    { key: "ux", label: "UX Clarity", score: ux, hint: scoreHint(ux, "Hierarchy") },
    { key: "mobile", label: "Mobile", score: mobile, hint: scoreHint(mobile, "Mobile scan") },
    { key: "seo", label: "SEO", score: seo, hint: scoreHint(seo, "Search signals") },
    { key: "aiVisibility", label: "AI Visibility", score: aiVisibility, hint: scoreHint(aiVisibility, "Entity signals") },
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
    conversion: "CTA focus competes with visual noise",
    trust: "Trust signals appear too late",
    ux: "Hero message lacks immediate business clarity",
    mobile: "Mobile hierarchy needs compression",
    seo: "Search intent signals are not fully aligned",
    aiVisibility: "AI-readable entity structure incomplete",
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
    low.has("conversion") ? "Conversion clarity below optimal range" : "Primary action path readable",
    low.has("trust") ? "Trust friction detected" : "Trust foundation visible",
    low.has("mobile") || low.has("ux") ? "Likely attention loss in first viewport" : "Interface hierarchy mostly stable",
    low.has("aiVisibility") || low.has("seo") ? "AI visibility partially limited" : "Search and AI signals aligned",
  ];

  return items.slice(0, 4);
}

function lockedLayerCopy(plan: AnalysisPlan) {
  if (plan === "premium") {
    return {
      title: "Strategic Report unlocked",
      items: ["Executive Recommendations active", "Consultant report active", "7-day action plan active"],
    };
  }

  if (plan === "full") {
    return {
      title: "Strategic Consultant Layer locked",
      items: ["Premium Report available", "Executive recommendations", "7-day action plan"],
    };
  }

  return {
    title: "3 deeper intelligence layers locked",
    items: ["Full Visual Audit available", "Revenue Impact Layer available", "Category breakdowns available"],
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
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/90 text-white shadow-[0_28px_90px_-56px_rgba(15,23,42,0.95)]">
      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Analysis complete
            </span>
            <span className="break-all rounded-full border border-white/10 bg-slate-900 px-3 py-1.5">
              {getDomain(result.finalUrl ?? result.url)}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1.5">
              {modeLabel(result.analysisMode)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>{formatDate(result.scannedAt ?? result.createdAt)}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
            <span>{reportLevel(plan)} report</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
            <span>Visual / UX / SEO / AI calibrated</span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)]">
        <div className="border-b border-white/10 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Website Intelligence Report
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Website Intelligence Score
              </h1>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
              {getOverallStatusLabel(overall)}
            </span>
          </div>

          <div className="mt-8 flex items-end gap-3">
            <div className="font-mono text-7xl font-semibold leading-none tracking-normal text-white sm:text-8xl">
              <ScoreCountUp value={overall} />
            </div>
            <div className="pb-2 font-mono text-2xl font-semibold text-slate-500">/100</div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-white/8">
            <div
              className={`h-2 rounded-full ${tone.progress}`}
              style={{ width: `${Math.max(8, overall)}%` }}
            />
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
            {scoreInterpretation(result, subscores)}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {impacts.map((item) => (
              <div key={item} className="border-l border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {subscores.map((item) => {
              const itemTone = getScoreTone(item.score);

              return (
                <article
                  key={item.key}
                  className={`min-h-[8.5rem] rounded-lg border p-4 ${item.locked ? "border-white/10 bg-slate-900/45 opacity-70" : itemTone.surface}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.locked ? "Deeper layer locked" : item.hint}</p>
                    </div>
                    <span className="font-mono text-xl font-semibold text-white">{item.score}</span>
                  </div>
                  <div className="mt-5 h-1.5 rounded-full bg-white/10">
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
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Critical Signals
                </h2>
                <span className="text-xs text-slate-500">{signals.length} detected</span>
              </div>
              <div className="mt-4 space-y-3">
                {signals.map((signal, index) => (
                  <div key={signal} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-0.5 font-mono text-xs text-cyan-300">0{index + 1}</span>
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-white">{locked.title}</p>
              <div className="mt-4 space-y-2">
                {locked.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
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
                    Premium PDF herunterladen
                  </Link>
                ) : canViewFull ? (
                  <PremiumReportRequestButton
                    analysisId={analysisId}
                    url={result.url}
                    label="49 EUR Premium Report"
                    className="w-full rounded-lg px-4 py-3 text-sm"
                  />
                ) : (
                  <CheckoutButton
                    analysisId={analysisId}
                    label="5 EUR Full Analysis"
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
