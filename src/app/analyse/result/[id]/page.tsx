import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckoutButton } from "@/components/CheckoutButton";
import { AnalysisSummary } from "@/components/results/analysis-summary";
import { FindingsList } from "@/components/results/findings-list";
import { MeasuresPlan } from "@/components/results/measures-plan";
import { MissionResultHero } from "@/components/results/mission-result-hero";
import { OpportunityList } from "@/components/results/opportunity-list";
import { PremiumAiReportSection } from "@/components/results/premium-ai-report-section";
import { PremiumPreviewLock } from "@/components/results/premium-preview-lock";
import { PremiumReportSection } from "@/components/results/premium-report-section";
import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";
import { RecommendationsList } from "@/components/results/recommendations-list";
import { RevenueBlockersReport } from "@/components/results/revenue-blockers-report";
import { ScoreGrid } from "@/components/results/score-grid";
import { SevenDayRoadmap } from "@/components/results/seven-day-roadmap";
import { VisualAuditSection } from "@/components/results/visual-audit-section";
import { getAnalysisResult } from "@/lib/analysisStore";
import { buildAnalysisOpportunities } from "@/lib/analyse/opportunity-engine";
import {
  canViewFullAnalysis,
  canViewPremiumReport,
  resolveAnalysisPlan,
} from "@/lib/premium/premiumAccess";
import { getOrCreatePremiumReport } from "@/lib/premium/premiumReportStore";
import { getAnalysisSummary } from "@/lib/result-ui";
import type { AnalysisOpportunity, AnalysisResult } from "@/types/analysis";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface AnalyseResultPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    premium?: string;
    success?: string;
    upgrade?: string;
  }>;
}

function fallbackOpportunities(analysis: AnalysisResult): AnalysisOpportunity[] {
  const sourceItems = [
    ...(analysis.revenueBlockers ?? []).map((item, index) => ({
      id: `revenue-${index}`,
      title: item.problem,
      description: item.action,
      category: item.category,
      businessImpact: item.whyItCostsCustomers,
      suggestedModule: item.suggestedModule ?? "Priorisierter Umsetzungshebel",
      suggestedService: item.suggestedService ?? "Umsetzung besprechen",
      expectedEffect: item.businessImpact,
      priorityScore: 95 - index,
    })),
    ...(analysis.measures ?? []).map((item, index) => ({
      id: `measure-${index}`,
      title: item.title,
      description: item.description,
      category: item.category,
      businessImpact: item.description,
      suggestedModule: "Massnahme priorisieren",
      suggestedService: "Umsetzung besprechen",
      expectedEffect: `Wirkung: ${item.impact}`,
      priorityScore: 82 - index,
    })),
    ...(analysis.findings ?? []).map((item, index) => ({
      id: `finding-${index}`,
      title: item.title,
      description: item.description,
      category: item.category,
      businessImpact: item.description,
      suggestedModule: "Befund in Handlung uebersetzen",
      suggestedService: "Umsetzung besprechen",
      expectedEffect: "Mehr Klarheit im naechsten Schritt.",
      priorityScore: 72 - index,
    })),
  ];

  return sourceItems.slice(0, 3).map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    severity: index === 0 ? "critical" : "high",
    businessImpact: item.businessImpact,
    aiOpportunity: "KI kann Varianten, Struktur und konkrete Umsetzungsideen fuer diesen Hebel vorbereiten.",
    suggestedModule: item.suggestedModule,
    suggestedService: item.suggestedService,
    implementationEffort: "medium",
    expectedEffect: item.expectedEffect,
    recurringPotential: index === 0,
    ctaLabel: "Diesen Hebel besprechen",
    ctaHref: "/#kontakt",
    sourceType: "finding",
    priorityScore: item.priorityScore,
  }));
}

export default async function AnalyseResultPage({
  params,
  searchParams,
}: AnalyseResultPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await getAnalysisResult(id);

  if (!result) {
    notFound();
  }

  const analysis = result.analysis;
  const plan = resolveAnalysisPlan(result);
  const canViewFull = canViewFullAnalysis(result);
  const canViewPremium = canViewPremiumReport(result);
  const isPaymentProcessing =
    resolvedSearchParams.success === "true" &&
    ((resolvedSearchParams.upgrade === "full" && plan !== "full" && plan !== "premium") ||
      (resolvedSearchParams.upgrade === "premium" && !canViewPremium));
  const premiumReport = canViewPremium
    ? await getOrCreatePremiumReport({ analysis: result })
    : null;
  const diagnosis = getAnalysisSummary(analysis);
  const generatedOpportunities = buildAnalysisOpportunities({
    revenueBlockers: analysis.revenueBlockers,
    measures: analysis.measures,
    findings: analysis.findings,
    aiSuggestions: analysis.aiSuggestions,
    overallScore: analysis.overallScore,
    url: analysis.url,
  });
  const opportunities = analysis.opportunities?.length
    ? analysis.opportunities
    : generatedOpportunities.length
      ? generatedOpportunities
      : fallbackOpportunities(analysis);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <MissionResultHero
          analysisId={result.id}
          result={analysis}
          plan={plan}
          canViewFull={canViewFull}
          canViewPremium={canViewPremium}
          isPaymentProcessing={isPaymentProcessing}
        />

        {!canViewFull ? (
          <>
            <section className="mt-8">
              <div className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Kurzueberblick
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Das Wichtigste aus dem kostenlosen Teaser
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">{diagnosis}</p>
                <div className="mt-6 grid gap-3">
                  {analysis.findings.slice(0, 2).map((finding) => (
                    <article
                      key={`${finding.category}-${finding.title}`}
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                        Hinweis
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-slate-950">{finding.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{finding.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8">
              <VisualAuditSection result={analysis} plan="free" analysisId={result.id} />
            </section>

            <section className="mt-8 rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Vollanalyse-Vorschau
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Vollanalyse fuer 5 EUR freischalten
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Vollstaendige Befunde",
                  "Kategorie-Auswertung",
                  "Visuelle Analyse",
                  "Konkrete KI- und Umsatzhebel",
                  "Massnahmen",
                  "KI-Sichtbarkeit",
                  "PDF-Export",
                ].map((item) => (
                  <div key={item} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="h-2 w-24 rounded-full bg-slate-200 blur-[1px]" />
                    <p className="mt-4 font-semibold text-slate-950">{item}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Dieser Bereich ist in der kostenlosen Vorschau gesperrt.
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <CheckoutButton
                  analysisId={result.id}
                  label="Vollanalyse fuer 5 EUR freischalten"
                  className="justify-center bg-slate-950 text-white hover:bg-slate-800"
                />
                <PremiumReportRequestButton
                  analysisId={result.id}
                  url={analysis.url}
                  label="Premium Analyse ansehen"
                />
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mt-8">
              <VisualAuditSection result={analysis} plan={canViewPremium ? "premium" : "full"} analysisId={result.id} />
            </section>

            {canViewPremium && premiumReport ? (
              <section className="mt-10">
                <PremiumReportSection report={premiumReport} analysisId={result.id}>
                  <PremiumAiReportSection analysisId={result.id} canViewPremium={canViewPremium} />
                </PremiumReportSection>
              </section>
            ) : (
              <section className="mt-10">
                <PremiumPreviewLock analysisId={result.id} url={analysis.url} />
              </section>
            )}

            <section className="mt-10">
              <OpportunityList opportunities={opportunities} />
            </section>

            <section className="mt-10">
              <SevenDayRoadmap
                quickPlan={premiumReport?.quickImplementationPlan}
                measures={analysis.measures ?? []}
              />
            </section>

            <details className="mt-10 rounded-[2rem] border border-white/10 bg-white/95 p-5 text-slate-950 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.35)] sm:p-7">
              <summary className="cursor-pointer text-xl font-bold tracking-tight">
                Detailanalyse und weitere Befunde anzeigen
              </summary>
              <div className="mt-7 space-y-8">
                <ScoreGrid result={analysis} />
                <FindingsList
                  findings={analysis.findings}
                  isPremium={canViewPremium}
                  analysisId={result.id}
                  totalFindings={analysis.totalFindings}
                  visibleFindings={canViewPremium ? analysis.totalFindings : analysis.visibleFindings}
                />
                <RecommendationsList recommendations={analysis.recommendations} isPremium={canViewPremium} />
                <AnalysisSummary result={analysis} />
                <MeasuresPlan measures={analysis.measures ?? []} />
                {canViewPremium ? (
                  <RevenueBlockersReport
                    analysisId={result.id}
                    url={analysis.url}
                    blockers={analysis.revenueBlockers ?? []}
                  />
                ) : null}
              </div>
            </details>
          </>
        )}

        <section className="mb-16 mt-10 flex justify-end">
          <Link
            href="/analyse"
            className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:border-cyan-500/50 hover:bg-slate-800"
          >
            Neue Analyse starten
          </Link>
        </section>
      </main>
    </div>
  );
}
