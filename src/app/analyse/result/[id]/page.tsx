import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckoutButton } from "@/components/CheckoutButton";
import { AnalysisSummary } from "@/components/results/analysis-summary";
import { FindingsList } from "@/components/results/findings-list";
import { MeasuresPlan } from "@/components/results/measures-plan";
import { MissionResultHero } from "@/components/results/mission-result-hero";
import { OpportunityList } from "@/components/results/opportunity-list";
import { PremiumPreviewLock } from "@/components/results/premium-preview-lock";
import { PremiumAiReportSection } from "@/components/results/premium-ai-report-section";
import { PremiumReportSection } from "@/components/results/premium-report-section";
import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";
import { RecommendationsList } from "@/components/results/recommendations-list";
import { RevenueBlockersReport } from "@/components/results/revenue-blockers-report";
import { ScoreGrid } from "@/components/results/score-grid";
import { VisualAuditSection } from "@/components/results/visual-audit-section";
import { getAnalysisResult } from "@/lib/analysisStore";
import {
  canViewFullAnalysis,
  canViewPremiumReport,
  resolveAnalysisPlan,
} from "@/lib/premium/premiumAccess";
import { getOrCreatePremiumReport } from "@/lib/premium/premiumReportStore";
import { getAnalysisSummary } from "@/lib/result-ui";

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

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
      <div className="pointer-events-none absolute top-[10%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-cyan-900/10 blur-[120px]"></div>

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
                  Ersteinschaetzung
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
                Gesperrte Bereiche
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Vollanalyse für 5 EUR freischalten
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Vollstaendige Findings",
                  "Kategorie-Breakdowns",
                  "Visuelle Analyse",
                  "Konkrete KI- und Umsatzhebel",
                  "Maßnahmen",
                  "AI Visibility",
                  "PDF Export",
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
              {analysis.opportunities?.length ? (
                <div className="mt-5 rounded-[1.2rem] border border-cyan-200 bg-cyan-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                    Opportunity Engine
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Wir haben weitere konkrete KI- und Umsatzhebel erkannt.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Die Vollanalyse zeigt die komplette Liste mit geschäftlicher Wirkung, KI-Chance,
                    empfohlenem Umsetzungspfad und dem nächsten sinnvollen Schritt.
                  </p>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <CheckoutButton
                  analysisId={result.id}
                  label="Vollanalyse für 5 EUR freischalten"
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

            <section className="mt-10">
              <ScoreGrid result={analysis} />
            </section>

            <section className="mt-10">
              <OpportunityList opportunities={analysis.opportunities} />
            </section>

            <section className="mt-10">
              <FindingsList
                findings={analysis.findings}
                isPremium
                analysisId={result.id}
                totalFindings={analysis.totalFindings}
                visibleFindings={analysis.totalFindings}
              />
            </section>

            <section className="mt-10">
              <RecommendationsList recommendations={analysis.recommendations} isPremium />
            </section>

            <section className="mt-10">
              <AnalysisSummary result={analysis} />
            </section>
          </>
        )}

        {canViewPremium ? (
          <>
            {premiumReport ? (
              <section className="mt-10">
                <PremiumReportSection report={premiumReport} analysisId={result.id} />
              </section>
            ) : null}

            <section className="mt-10">
              <PremiumAiReportSection analysisId={result.id} canViewPremium={canViewPremium} />
            </section>

            <section className="mt-10">
              <MeasuresPlan measures={analysis.measures ?? []} />
            </section>

            <section className="mt-10">
              <RevenueBlockersReport
                analysisId={result.id}
                url={analysis.url}
                blockers={analysis.revenueBlockers ?? []}
              />
            </section>
          </>
        ) : null}

        {canViewFull && !canViewPremium ? (
          <section className="mt-10">
            <PremiumPreviewLock analysisId={result.id} url={analysis.url} />
          </section>
        ) : null}

        <section className="mt-10 mb-16 flex justify-end">
          <Link
            href="/analyse"
            className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-4 text-sm font-semibold text-white hover:bg-slate-800 hover:border-cyan-500/50 transition-all shadow-lg backdrop-blur-md"
          >
            Neue Analyse starten
          </Link>
        </section>
      </main>
    </div>
  );
}
