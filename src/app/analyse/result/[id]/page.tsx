import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalysisSummary } from "@/components/results/analysis-summary";
import { MeasuresPlan } from "@/components/results/measures-plan";
import { PremiumPreviewLock } from "@/components/results/premium-preview-lock";
import { PremiumReportSection } from "@/components/results/premium-report-section";
import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";
import { RevenueBlockersReport } from "@/components/results/revenue-blockers-report";
import { ScoreGrid } from "@/components/results/score-grid";
import { VisualAuditSection } from "@/components/results/visual-audit-section";
import { getAnalysisResult } from "@/lib/analysisStore";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";
import { getOrCreatePremiumReport } from "@/lib/premium/premiumReportStore";
import { getAnalysisSummary, getOverallStatusLabel, getScoreTone } from "@/lib/result-ui";

interface AnalyseResultPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    premium?: string;
  }>;
}

export default async function AnalyseResultPage({
  params,
  searchParams,
}: AnalyseResultPageProps) {
  const { id } = await params;
  await searchParams;
  const result = await getAnalysisResult(id);

  if (!result) {
    notFound();
  }

  const analysis = result.analysis;
  const canViewPremium = canViewPremiumReport(result.paymentStatus);
  const premiumReport = canViewPremium
    ? await getOrCreatePremiumReport({ analysis: result })
    : null;
  const overallTone = getScoreTone(analysis.overallScore);
  const diagnosis = getAnalysisSummary(analysis);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
      <div className="pointer-events-none absolute top-[10%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-cyan-900/10 blur-[120px]"></div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(30,41,59,0.85)_48%,_rgba(8,145,178,0.2)_100%)] px-6 py-8 text-white shadow-2xl backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15),_transparent_60%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)] xl:items-start">
            <div className="min-w-0 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
                Analyseergebnis
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl xl:text-[4.25rem] xl:leading-[1.02] bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                Dein Shophebel Analyse-Ergebnis
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                {diagnosis}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="max-w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 break-all backdrop-blur-md shadow-inner">
                  {analysis.url}
                </span>
                <span className="max-w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 break-all backdrop-blur-md shadow-inner text-slate-400">
                  Anfrage: {analysis.requestedUrl}
                </span>
              </div>
            </div>

            <div className="grid h-full gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="flex min-h-[10.5rem] flex-col rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition-all hover:border-cyan-500/30 hover:bg-white/10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Gesamt-Score
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm ${overallTone.badge}`}
                  >
                    <span className="whitespace-normal break-words">
                      {getOverallStatusLabel(analysis.overallScore)}
                    </span>
                  </span>
                  <span className="text-3xl font-semibold text-white sm:text-5xl drop-shadow-md">
                    {analysis.overallScore}<span className="text-xl sm:text-2xl text-slate-400">/100</span>
                  </span>
                </div>
              </div>
              <div className="flex min-h-[10.5rem] flex-col rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Nächster Schritt
                </p>
                {canViewPremium ? (
                  <div className="mt-4 space-y-3">
                    <p className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                      Premium-Report freigeschaltet
                    </p>
                    <Link
                      href={`/api/premium-report/${encodeURIComponent(result.id)}/pdf`}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400 px-4 py-3 text-center text-sm font-bold text-slate-950 shadow-lg transition-all hover:bg-cyan-300"
                    >
                      Premium-Report als PDF herunterladen
                    </Link>
                  </div>
                ) : (
                  <PremiumReportRequestButton
                    analysisId={result.id}
                    url={analysis.url}
                    label="Premium-Report freischalten"
                    className="mt-4 w-full"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <VisualAuditSection result={analysis} />
        </section>

        <section className="mt-10">
          <ScoreGrid result={analysis} />
        </section>

        {canViewPremium ? (
          <>
            {premiumReport ? (
              <section className="mt-10">
                <PremiumReportSection report={premiumReport} analysisId={result.id} />
              </section>
            ) : null}

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

        <section className="mt-10">
          <AnalysisSummary result={analysis} />
        </section>

        {!canViewPremium ? (
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
