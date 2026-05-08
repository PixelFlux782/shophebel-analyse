"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AnalysisResult } from "@/types/analysis";

interface UrlFormProps {
  initialUrl?: string;
}

const DEMO_OPTIONS = [
  {
    type: "onlineshop",
    title: "Onlineshop",
    description: "Kleiner Shop für Naturkosmetik",
    icon: "🛍️"
  },
  {
    type: "handwerker",
    title: "Handwerksbetrieb",
    description: "Schreinerei mit Möbelfertigung",
    icon: "🔨"
  },
  {
    type: "restaurant",
    title: "Restaurant",
    description: "Feinkostladen & mediterrane Küche",
    icon: "🍽️"
  }
];

export function UrlForm({ initialUrl = "" }: UrlFormProps) {
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
    <div className="space-y-6">
      {/* Haupt-Form */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-50"></div>
        <div className="relative">
          <label htmlFor="url" className="block text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
            Shop URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://dein-shop.de"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-cyan-600 px-5 py-4 text-base font-semibold text-white transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <span className="relative">{isSubmitting ? "Analyse läuft..." : "Analyse starten"}</span>
          </button>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-md">{error}</p>
          ) : null}
        </div>
      </form>

      {/* Demo-Section */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Demo-Analysen</h3>
            <p className="mt-1 text-sm text-slate-500">Erkunde alle Features ohne echte Website</p>
          </div>
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-md"
          >
            {showDemo ? "Ausblenden" : "Anzeigen"}
          </button>
        </div>

        {showDemo && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {DEMO_OPTIONS.map((demo) => (
              <button
                key={demo.type}
                onClick={() => handleDemoSubmit(demo.type)}
                disabled={isSubmitting}
                className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left shadow-sm transition-all hover:border-cyan-500/30 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{demo.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">{demo.title}</h4>
                    <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{demo.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
