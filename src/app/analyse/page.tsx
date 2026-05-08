import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import { UrlForm } from "@/components/UrlForm";
import { SHOPHEBEL_HOME_URL } from "@/lib/env";

interface AnalysePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const params = await searchParams;
  const urlParam = params.url;
  const initialUrl = typeof urlParam === "string" ? urlParam : "";

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-cyan-900/20 blur-[120px]"></div>
      <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[40rem] w-[40rem] rounded-full bg-blue-900/20 blur-[100px]"></div>
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <section>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Teil von Shophebel - digitale Schwächen finden und konkrete Hebel ableiten.
            </p>
            <Link href={SHOPHEBEL_HOME_URL} className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-md">
              Zurück zu Shophebel
            </Link>

            <div className="mt-8">
              <SectionHeader
                eyebrow="Website-Check"
                title={<span className="text-white">Analysiere deinen Onlineshop jetzt</span>}
                description={<span className="text-slate-400">Gib die URL deines Shops ein und erhalte eine klare Analyse zu Vertrauen, Klarheit, Ladegefühl, mobiler Nutzung und AI-Sichtbarkeit.</span>}
              />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-cyan-500/30">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-500">Gesamt Score</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">
                  Ein klarer Schnellcheck für die aktuelle Wirkung deines Shops.
                </p>
              </div>
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-cyan-500/30">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-500">Sichtbarkeit & Vertrauen</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">
                  Wir zeigen, ob Besucher, Google und KI-Systeme dein Angebot schnell genug verstehen.
                </p>
              </div>
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-cyan-500/30">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-500">Anfragen & Nutzerführung</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">
                  Erkenne schneller, wo Orientierung, Struktur und Kaufmotivation verloren gehen.
                </p>
              </div>
            </div>
          </section>

          <section>
            <UrlForm initialUrl={initialUrl} />
          </section>
        </div>
      </main>
    </div>
  );
}
