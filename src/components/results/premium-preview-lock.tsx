import { PremiumReportRequestButton } from "@/components/results/premium-report-request-button";

interface PremiumPreviewLockProps {
  analysisId: string;
  url: string;
}

const premiumItems = [
  "vollständige Fehlerliste",
  "priorisierte Maßnahmen",
  "Wettbewerbsvergleich",
  "konkrete Textvorschläge",
  "Umsetzungs-To-dos",
  "PDF-Export",
  "30-Minuten Auswertungsgespräch",
];

const premiumPreviewItems = [
  "Problemübersicht: 18 Punkte",
  "Top-Maßnahme: Vertrauen früher sichtbar machen",
  "Wettbewerber: klarere Kategorie-Texte",
  "To-do: Informationen für Google und KI klar auszeichnen",
];

export function PremiumPreviewLock({ analysisId, url }: PremiumPreviewLockProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96)_55%,_rgba(49,46,129,0.94)_100%)] p-6 text-white shadow-[0_36px_120px_-60px_rgba(15,23,42,0.75)] sm:p-8">
      <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-400/18 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Premium-Vorschau</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Aus dem Schnellcheck wird ein konkreter Arbeitsplan.</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
            Der kostenlose Check zeigt den Wert. Der Premium-Report macht daraus eine priorisierte Umsetzungsliste mit Texten, klaren To-dos und persönlicher Einordnung.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {premiumItems.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-sm font-semibold text-slate-100 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
          <div className="absolute inset-5 rounded-[1.2rem] bg-slate-950/20 backdrop-blur-[5px]" />
          <div className="relative space-y-3 blur-[2px]">
            {premiumPreviewItems.map((line) => (
              <div key={line} className="rounded-xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">
                {line}
              </div>
            ))}
          </div>
          <div className="relative mt-6 rounded-2xl border border-cyan-300/25 bg-slate-950/70 p-5 shadow-[0_24px_80px_-54px_rgba(34,211,238,0.85)]">
            <p className="text-sm font-bold text-cyan-100">Gesperrt</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Fordere den Premium-Report an und erhalte die vollständige Auswertung für diese URL.
            </p>
            <PremiumReportRequestButton analysisId={analysisId} url={url} className="mt-4 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
