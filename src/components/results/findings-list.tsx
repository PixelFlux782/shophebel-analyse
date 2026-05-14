import { Finding } from "@/types/analysis";
import { getLockedFindingsPreview, getVisibleFindings } from "@/lib/result-ui";

import { CheckoutButton } from "@/components/CheckoutButton";
import { FindingCard } from "@/components/results/finding-card";

interface FindingsListProps {
  findings: Finding[];
  isPremium: boolean;
  analysisId: string;
  totalFindings: number;
  visibleFindings: number;
}

export function FindingsList({
  findings,
  isPremium,
  analysisId,
  totalFindings,
  visibleFindings,
}: FindingsListProps) {
  const displayedFindings = getVisibleFindings(findings, isPremium);
  const lockedPreview = isPremium ? [] : getLockedFindingsPreview(findings);
  const hiddenFindingsCount = Math.max(0, totalFindings - visibleFindings);

  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Findings
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Was auf der Startseite auffaellt
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {isPremium ? totalFindings : displayedFindings.length} von {totalFindings} Punkten sichtbar
        </p>
      </div>

      {displayedFindings.length === 0 ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
          Keine Findings vorhanden. Das ist ein gutes Zeichen, aber eine tiefere Vollanalyse kann dennoch weitere Hebel sichtbar machen.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {displayedFindings.map((finding) => (
            <FindingCard
              key={`${finding.category}-${finding.title}-${finding.priority}`}
              finding={finding}
            />
          ))}
        </div>
      )}

      {!isPremium && hiddenFindingsCount > 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Premium Vorschau
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                Weitere {hiddenFindingsCount} Optimierungen verfügbar
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Vollanalyse freischalten, um alle Optimierungen zu sehen und sauber zu priorisieren.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {lockedPreview.map((finding) => (
              <article
                key={`locked-${finding.category}-${finding.title}`}
                className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/80 px-4 py-4"
              >
                <div className="pointer-events-none select-none blur-[2px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {finding.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {finding.priority}
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-slate-950">
                    {finding.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {finding.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/45 to-white/75" />
              </article>
            ))}
          </div>

          <div className="mt-5">
            <CheckoutButton
              analysisId={analysisId}
              label="Vollanalyse freischalten, um alle Optimierungen zu sehen"
              className="w-full justify-center bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
