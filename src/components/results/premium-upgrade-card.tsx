import Link from "next/link";

import { CheckoutButton } from "@/components/CheckoutButton";

interface PremiumUpgradeCardProps {
  analysisId: string;
  hiddenFindingsCount: number;
  isPremium: boolean;
}

export function PremiumUpgradeCard({
  analysisId,
  hiddenFindingsCount,
  isPremium,
}: PremiumUpgradeCardProps) {
  if (isPremium) {
    return (
      <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/80 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.22)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Vollanalyse aktiv
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Du siehst die komplette Analyse
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Alle Findings und Empfehlungen sind freigeschaltet. Diese Ansicht eignet sich als priorisierte Arbeitsgrundlage fuer die naechsten Optimierungsschritte.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96)_55%,_rgba(17,24,39,0.98)_100%)] p-8 text-white shadow-[0_36px_120px_-60px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.18),_transparent_60%)]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Premium Upgrade
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Mehr Klarheit mit der Vollanalyse
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-200">
            Du siehst aktuell nur einen Teil der Analyse. Noch {hiddenFindingsCount} weitere Optimierungen warten auf dich, inklusive konkretem Massnahmenplan.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              Vollstaendige Analyse statt Ausschnitt
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              Konkrete To-do-Liste fuer die naechsten Schritte
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              Priorisierte Massnahmen nach Hebel und Aufwand
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              Mehr Umsatzpotenzial frueher erkennen
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Preis
          </p>
          <p className="mt-3 text-5xl font-semibold">9,99 EUR</p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            Ein sinnvoller naechster Schritt, wenn du aus dieser Analyse konkrete Prioritaeten und mehr Sicherheit fuer die Optimierung ableiten willst.
          </p>
          <CheckoutButton
            analysisId={analysisId}
            className="mt-6 w-full justify-center"
            label="Vollanalyse freischalten"
          />
          <Link
            href="/analyse"
            className="mt-3 inline-flex text-sm font-medium text-cyan-100 hover:text-white"
          >
            Oder eine neue Analyse starten
          </Link>
        </div>
      </div>
    </section>
  );
}
