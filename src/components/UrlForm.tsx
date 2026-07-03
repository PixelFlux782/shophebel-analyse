"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { buildCheckoutRequestPayload, CheckoutPlan } from "@/lib/checkout-client";
import { AnalysisResult } from "@/types/analysis";

interface UrlFormProps {
  initialUrl?: string;
  initialPlan?: CheckoutPlan;
}

const DEMO_OPTIONS = [
  {
    type: "onlineshop",
    title: "Onlineshop",
    description: "Naturkosmetik-Shop mit typischen Vertrauens- und Button-Hebeln",
    icon: "01",
  },
  {
    type: "handwerker",
    title: "Handwerksbetrieb",
    description: "Lokaler Anbieter mit Anfrage- und Kontaktpotenzial",
    icon: "02",
  },
  {
    type: "restaurant",
    title: "Restaurant",
    description: "Feinkost & Gastronomie mit mobiler Suchintention",
    icon: "03",
  },
];

const TRUST_BADGES = [
  "Keine Registrierung",
  "Ergebnis sofort sichtbar",
  "Konkrete Maßnahmen",
  "Premium-Bericht optional",
];

export function UrlForm({ initialUrl = "", initialPlan }: UrlFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setError("Bitte gib eine gültige URL ein.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = (await response.json()) as AnalysisResult & { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Analyse konnte nicht gestartet werden.");
      }

      if (initialPlan) {
        const checkoutResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(buildCheckoutRequestPayload({
            analysisId: payload.id,
            productType: initialPlan === "full" ? "full_analysis" : "premium_report",
            plan: initialPlan,
          })),
        });
        const checkoutPayload = (await checkoutResponse.json()) as { url?: string; error?: string };

        if (!checkoutResponse.ok || !checkoutPayload.url) {
          throw new Error(checkoutPayload.error || "Checkout konnte nicht gestartet werden.");
        }

        window.location.href = checkoutPayload.url;
        return;
      }

      router.push(`/analyse/result/${payload.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Analyse konnte nicht gestartet werden.";
      setError(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  async function handleDemoSubmit(demoType: string) {
    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ type: demoType }),
      });

      const payload = (await response.json()) as AnalysisResult & { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Demo-Analyse konnte nicht gestartet werden.");
      }

      router.push(`/analyse/result/${payload.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Demo-Analyse konnte nicht gestartet werden.";
      setError(message);
      setIsSubmitting(false);
      return;
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(2,6,23,0.94))] p-5 shadow-[0_34px_120px_-64px_rgba(34,211,238,0.75)] backdrop-blur-xl sm:p-8"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-8 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Kostenloser Website-Check
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Gib deine URL ein. Shophebel zeigt dir die größten Hebel.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Analyse für UX, Vertrauen, Ladegefühl, mobile Wirkung und KI-Sichtbarkeit.
          </p>

          <label htmlFor="url" className="mt-7 block text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Website URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://dein-shop.de"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-cyan-300/20 bg-slate-950/75 px-5 py-5 text-lg text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-300/70 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-400/10"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative mt-5 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-cyan-400 px-5 py-4 text-base font-bold text-slate-950 shadow-[0_18px_60px_-28px_rgba(34,211,238,0.9)] transition-all hover:-translate-y-0.5 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div className="absolute inset-0 translate-x-[-100%] bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.38)_50%,rgba(255,255,255,0)_100%)] transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
            <span className="relative">
              {isSubmitting
                ? initialPlan
                  ? "Analyse und Checkout werden vorbereitet..."
                  : "Analyse laeuft..."
                : initialPlan === "full"
                  ? "Analyse starten und Vollanalyse freischalten"
                  : initialPlan === "premium"
                    ? "Analyse starten und Premium-Bericht kaufen"
                    : "Kostenlose Analyse starten"}
            </span>
          </button>

          <div className="mt-5 flex flex-wrap gap-2">
            {TRUST_BADGES.map((badge) => (
              <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {badge}
              </span>
            ))}
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-md">{error}</p>
          ) : null}
        </div>
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Beispiel-Analyse</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sieh dir zuerst ein fertiges Ergebnis an und prüfe, wie der Bericht aufgebaut ist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white backdrop-blur-md"
          >
            {showDemo ? "Beispiele ausblenden" : "Beispiel-Analyse ansehen"}
          </button>
        </div>

        {showDemo && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {DEMO_OPTIONS.map((demo) => (
              <button
                key={demo.type}
                type="button"
                onClick={() => handleDemoSubmit(demo.type)}
                disabled={isSubmitting}
                className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left shadow-sm transition-all hover:border-cyan-500/40 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-bold text-cyan-100 transition-transform group-hover:scale-105">
                    {demo.icon}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-200 transition-colors group-hover:text-white">{demo.title}</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500 transition-colors group-hover:text-slate-400">{demo.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-xl">
        <p className="text-sm font-semibold text-cyan-100">Premium-Bericht</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Willst du wissen, was du konkret ändern solltest? Der Premium-Bericht ergänzt Screenshots, Prioritäten und einen 7-Tage-Fahrplan.
        </p>
      </div>
    </div>
  );
}
