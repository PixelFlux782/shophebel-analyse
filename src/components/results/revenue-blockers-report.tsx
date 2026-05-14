import { RevenueBlocker } from "@/types/analysis";
import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";

interface RevenueBlockersReportProps {
  analysisId: string;
  url: string;
  blockers: RevenueBlocker[];
}

const effortClasses: Record<RevenueBlocker["estimatedEffort"], string> = {
  niedrig: "bg-emerald-100 text-emerald-800",
  mittel: "bg-amber-100 text-amber-800",
  hoch: "bg-rose-100 text-rose-800",
};

const impactClasses: Record<RevenueBlocker["estimatedImpact"], string> = {
  niedrig: "bg-slate-100 text-slate-700",
  mittel: "bg-cyan-100 text-cyan-800",
  hoch: "bg-violet-100 text-violet-800",
};

function BlockerMetaBadge({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      <span className="opacity-70">{label}</span>
      {value}
    </span>
  );
}

export function RevenueBlockersReport({
  analysisId,
  url,
  blockers,
}: RevenueBlockersReportProps) {
  if (blockers.length === 0) {
    return null;
  }

  return (
    <section
      id="umsatzbremsen-report"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.35)] print:border-slate-300 print:shadow-none sm:p-7"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Report-Typ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Die 5 größten Umsatzbremsen deiner Website
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Dieser Report übersetzt den Check in konkrete Bremsen: was Besucher kostet, was zu tun ist und womit du anfangen solltest. Die Struktur ist bewusst PDF-freundlich vorbereitet.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 print:hidden">
          Webansicht, später PDF-exportierbar
        </div>
      </div>

      <div className="mt-7 space-y-5">
        {blockers.map((blocker) => (
          <article
            key={`${blocker.priority}-${blocker.problem}`}
            className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-50 print:break-inside-avoid"
          >
            <div className="grid gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a,#102033)] px-5 py-5 text-white lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-2xl font-bold text-slate-950">
                {blocker.priority}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  {blocker.category}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight">{blocker.problem}</h3>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">
                Priorität {blocker.priority}
              </div>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                  Warum das Kunden kostet
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {blocker.whyItCostsCustomers}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                  Konkrete Maßnahme
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {blocker.action}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Einschätzung
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <BlockerMetaBadge
                    label="Aufwand"
                    value={blocker.estimatedEffort}
                    className={effortClasses[blocker.estimatedEffort]}
                  />
                  <BlockerMetaBadge
                    label="Wirkung"
                    value={blocker.estimatedImpact}
                    className={impactClasses[blocker.estimatedImpact]}
                  />
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  Grundlage: erkannter Check „{blocker.sourceCheck}“.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 print:hidden">
              <PremiumReportRequestButton
                analysisId={analysisId}
                url={url}
                label="Umsetzung durch Shophebel anfragen"
                className="w-full sm:w-auto"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
