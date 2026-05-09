import Link from "next/link";

import { SuccessRedirect } from "./success-redirect";

interface CheckoutSuccessPageProps {
  searchParams?: Promise<{
    analysisId?: string | string[];
    analysis?: string | string[];
  }>;
}

function getFirstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const analysisId =
    getFirstSearchParam(resolvedSearchParams.analysisId) ??
    getFirstSearchParam(resolvedSearchParams.analysis);
  const resultHref = analysisId
    ? `/analyse/result/${encodeURIComponent(analysisId)}`
    : null;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.16),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]" />
      <section className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-8 text-center shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-inner">
          <svg
            aria-hidden="true"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Zahlung erfolgreich
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Deine Premium-Analyse ist bereit
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
          Premium wird freigeschaltet. Du kannst direkt zur Analyse zurueckkehren
          und die erweiterten Inhalte ansehen.
        </p>

        {resultHref ? (
          <SuccessRedirect resultHref={resultHref} />
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm leading-7 text-amber-900">
            <p className="font-semibold">Analyse-ID fehlt</p>
            <p className="mt-1">
              Die Zahlung war erfolgreich, aber der Link enthaelt keine
              Analyse-ID. Oeffne deine Analyse erneut oder kontaktiere uns,
              falls die Freischaltung nicht sichtbar ist.
            </p>
            <Link
              href="/analyse"
              className="mt-4 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Zur Analyse
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
