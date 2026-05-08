export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_100px_-60px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600">
          Checkout
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Zahlung erfolgreich - deine Analyse wird freigeschaltet
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Der Zahlungsprozess wurde abgeschlossen. Im naechsten Schritt kannst du die freigeschalteten Inhalte oder Folge-Logik anbinden.
        </p>
      </section>
    </main>
  );
}
