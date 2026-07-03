import { buildOpportunityContactUrl } from "@/lib/opportunity-contact-url";
import { polishPremiumText, sentenceCasePremiumText } from "@/lib/premium/premiumCopy";
import type { AnalysisOpportunity, OpportunitySeverity } from "@/types/analysis";

interface OpportunityListProps {
  opportunities?: AnalysisOpportunity[];
}

const MAX_VISIBLE_OPPORTUNITIES = 3;

const severityClasses: Record<OpportunitySeverity, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-cyan-100 text-cyan-800",
  high: "bg-amber-100 text-amber-900",
  critical: "bg-rose-100 text-rose-800",
};

const severityLabels: Record<OpportunitySeverity, string> = {
  low: "Prioritaet niedrig",
  medium: "Prioritaet mittel",
  high: "Prioritaet hoch",
  critical: "Prioritaet kritisch",
};

const categoryLabels: Record<string, string> = {
  seo: "Auffindbarkeit",
  performance: "Ladegefuehl",
  trust: "Vertrauen",
  conversion: "Anfrage- und Kaufklarheit",
  design: "Design",
  aiVisibility: "KI-Sichtbarkeit",
  ux: "Nutzerfuehrung",
};

function getCategoryLabel(category: string) {
  return polishPremiumText(categoryLabels[category] ?? category);
}

function getOpportunityCtaHref(opportunity: AnalysisOpportunity) {
  const hasConcreteHandoffContext =
    Boolean(opportunity.suggestedModule) || Boolean(opportunity.suggestedService);

  if (!hasConcreteHandoffContext) {
    return opportunity.ctaHref;
  }

  try {
    return buildOpportunityContactUrl({
      opportunityTitle: opportunity.title,
      businessImpact: polishPremiumText(opportunity.businessImpact),
      suggestedModule: polishPremiumText(opportunity.suggestedModule),
      suggestedService: polishPremiumText(opportunity.suggestedService),
      ctaLabel: sentenceCasePremiumText(opportunity.ctaLabel),
      source: "analysis",
    });
  } catch {
    return opportunity.ctaHref;
  }
}

function OpportunityField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{polishPremiumText(value)}</p>
    </div>
  );
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  const visibleOpportunities = opportunities?.slice(0, MAX_VISIBLE_OPPORTUNITIES) ?? [];
  const hiddenOpportunities = opportunities?.slice(MAX_VISIBLE_OPPORTUNITIES) ?? [];

  if (visibleOpportunities.length === 0) {
    return null;
  }

  return (
    <section
      id="opportunity-engine"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.35)] sm:p-7"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Die wichtigsten 3 Hebel
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Was jetzt am staerksten auf Anfragen und Kaeufe wirkt
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Dieser Block buendelt Befunde, Empfehlungen und Umsatzbremsen zu drei priorisierten Hebeln.
            Weitere Details bleiben darunter abrufbar.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
          {visibleOpportunities.length} priorisierte Hebel
        </div>
      </div>

      <div className="mt-7 grid gap-5">
        {visibleOpportunities.map((opportunity, index) => (
          <article
            key={opportunity.id}
            className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-50"
          >
            <div className="grid gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a,#102033)] px-5 py-5 text-white lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-2xl font-bold text-slate-950">
                {index + 1}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  {getCategoryLabel(opportunity.category)}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight">{polishPremiumText(opportunity.title)}</h3>
              </div>
              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${severityClasses[opportunity.severity]}`}
              >
                {severityLabels[opportunity.severity]}
              </span>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <OpportunityField label="Geschaeftliche Wirkung" value={opportunity.businessImpact} />
              <OpportunityField label="KI-Chance" value={opportunity.aiOpportunity} />
              <OpportunityField label="Empfohlener Umsetzungspfad" value={opportunity.suggestedModule} />
              <OpportunityField label="Empfohlene Begleitung" value={opportunity.suggestedService} />
              <OpportunityField label="Erwarteter Effekt" value={opportunity.expectedEffect} />
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Wiederkehrendes Potenzial
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {opportunity.recurringPotential
                    ? "Eignet sich als wiederkehrender Optimierungs- oder Monitoring-Hebel."
                    : "Vor allem als einmaliger naechster sinnvoller Schritt geeignet."}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <a
                href={getOpportunityCtaHref(opportunity)}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_36px_-20px_rgba(15,23,42,0.8)] transition hover:bg-slate-800 sm:w-auto"
              >
                {sentenceCasePremiumText(opportunity.ctaLabel)}
              </a>
            </div>
          </article>
        ))}
      </div>

      {hiddenOpportunities.length ? (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-950">
            Weitere Hebel anzeigen
          </summary>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {hiddenOpportunities.map((opportunity) => (
              <article key={opportunity.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                  {getCategoryLabel(opportunity.category)}
                </p>
                <h3 className="mt-2 text-base font-bold text-slate-950">
                  {polishPremiumText(opportunity.title)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {polishPremiumText(opportunity.businessImpact)}
                </p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
