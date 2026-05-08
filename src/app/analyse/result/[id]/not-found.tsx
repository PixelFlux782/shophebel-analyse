import Link from "next/link";

export default function ResultNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_100px_-60px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Ergebnis nicht verfuegbar
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Dieses Analyse-Ergebnis konnte nicht gefunden werden
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Starte eine neue Analyse, um wieder eine aktuelle Auswertung deiner Startseite zu sehen.
        </p>
        <Link
          href="/analyse"
          className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Neue Analyse starten
        </Link>
      </section>
    </main>
  );
}
