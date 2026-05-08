function LoadingCard() {
  return (
    <div className="relative animate-pulse overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
      <div className="relative z-10">
        <div className="h-4 w-24 rounded-full bg-slate-800" />
        <div className="mt-4 h-10 w-20 rounded-lg bg-slate-800" />
        <div className="mt-6 h-2 w-full rounded-full bg-slate-800" />
        <div className="mt-5 h-4 w-full rounded-full bg-slate-800" />
        <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-cyan-900/20 blur-[120px]"></div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative animate-pulse overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 px-6 py-8 shadow-2xl backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1),_transparent_58%)]" />
          <div className="relative z-10">
            <div className="h-4 w-32 rounded-full bg-slate-800" />
            <div className="mt-4 h-12 w-96 max-w-full rounded-xl bg-slate-800" />
            <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-slate-800" />
            <div className="mt-2 h-4 w-5/6 max-w-2xl rounded-full bg-slate-800" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="relative animate-pulse overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-900/60 p-7 backdrop-blur-md">
            <div className="h-4 w-24 rounded-full bg-slate-800" />
            <div className="mt-3 h-8 w-60 rounded-lg bg-slate-800" />
            <div className="mt-5 h-4 w-full rounded-full bg-slate-800" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-800" />
          </div>
          <div className="relative animate-pulse overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-900/60 p-7 backdrop-blur-md">
            <div className="h-4 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-8 w-72 rounded-lg bg-slate-800" />
            <div className="mt-5 space-y-3">
              <div className="h-24 rounded-xl bg-slate-800" />
              <div className="h-24 rounded-xl bg-slate-800" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
