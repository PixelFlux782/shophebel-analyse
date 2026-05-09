import { Finding, Recommendation } from "@/types/analysis";

interface FreeAuditPreviewProps {
  quickWins: Recommendation[];
  criticalIssues: Recommendation[];
  fallbackFindings: Finding[];
}

function ImpactBadge({ impact }: { impact: Recommendation["impact"] }) {
  const classes = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${classes[impact]}`}>
      {impact}
    </span>
  );
}

function recommendationFromFinding(finding: Finding): Recommendation {
  return {
    title: finding.title,
    text: finding.description,
    description: finding.description,
    impact: finding.priority,
    effort: finding.status === "error" ? "medium" : "low",
    category: finding.category,
    weight: 0,
  };
}

export function FreeAuditPreview({
  quickWins,
  criticalIssues,
  fallbackFindings,
}: FreeAuditPreviewProps) {
  const fallbackProblems = fallbackFindings
    .filter((finding) => finding.status !== "success")
    .map(recommendationFromFinding);
  const visibleQuickWins = (quickWins.length > 0 ? quickWins : fallbackProblems).slice(0, 3);
  const visibleCritical = (
    criticalIssues.length > 0
      ? criticalIssues
      : fallbackProblems.filter((item) => item.impact === "high")
  ).slice(0, 3);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[1.8rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Kostenlose Ergebnisse</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">3 schnelle Hebel</h2>
        <div className="mt-5 space-y-3">
          {visibleQuickWins.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <ImpactBadge impact={item.impact} />
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">Kostenlose Ergebnisse</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">3 kritische Punkte</h2>
        <div className="mt-5 space-y-3">
          {visibleCritical.map((item) => (
            <article key={item.title} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <ImpactBadge impact={item.impact} />
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-700">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
