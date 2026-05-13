import Link from "next/link";

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[50rem] w-[50rem] rounded-full bg-cyan-900/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[40rem] w-[40rem] rounded-full bg-blue-900/25 blur-[100px]" />
      <div className="pointer-events-none absolute left-[35%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-white/[0.035] blur-[110px]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <section>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 shadow-2xl backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              Website Intelligence fuer Shops
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.03]">
              Finde in 60 Sekunden heraus, warum dein Shop nicht mehr verkauft.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Shophebel analysiert Vertrauen, Klarheit, Ladegefuehl, mobile Wirkung und KI-Sichtbarkeit - und zeigt konkrete Hebel statt abstrakter SEO-Daten.
            </p>

            <Link href={SHOPHEBEL_HOME_URL} className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white backdrop-blur-md">
              Zurueck zu Shophebel
            </Link>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:bg-slate-900/60">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Umsatzbremsen</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">
                  Erkenne, wo Vertrauen, Orientierung und Kaufmotivation sichtbar verloren gehen.
                </p>
              </div>
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:bg-slate-900/60">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Visuelle Wirkung</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">
                  Screenshots machen klar, wie dein Shop auf Desktop und Mobile tatsaechlich wirkt.
                </p>
              </div>
              <div className="group rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:bg-slate-900/60">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Prioritaeten</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">
                  Du bekommst konkrete naechste Schritte statt Tabellen, die niemand umsetzt.
                </p>
              </div>
            </div>
          </section>

          <section className="lg:pl-4">
            <UrlForm initialUrl={initialUrl} />
          </section>
        </div>
      </main>
    </div>
  );
}
