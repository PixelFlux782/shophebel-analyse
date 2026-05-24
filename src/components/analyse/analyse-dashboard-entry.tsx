"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { buildCheckoutRequestPayload, CheckoutPlan } from "@/lib/checkout-client";
import { AnalysisResult } from "@/types/analysis";

interface AnalyseDashboardEntryProps {
  initialUrl?: string;
  initialPlan?: CheckoutPlan;
}

type ScanState = "idle" | "scanning" | "error";

const scanSteps = [
  "URL erreichbar pruefen",
  "Sichtbarkeit und Struktur lesen",
  "Trust-Signale erkennen",
  "Nutzerfuehrung bewerten",
  "Conversion-Hebel priorisieren",
];

const demoSignals = [
  { label: "Trust Signal", value: 58, tone: "risk" },
  { label: "CTA Klarheit", value: 64, tone: "watch" },
  { label: "Mobile UX", value: 72, tone: "stable" },
  { label: "AI Visibility", value: 49, tone: "risk" },
];

const demoLevers = [
  {
    label: "Hero und Angebot klarer machen",
    detail: "Besucher sollen in wenigen Sekunden verstehen, was angeboten wird und was der naechste Schritt ist.",
    priority: "Kritisch",
  },
  {
    label: "Vertrauen vor dem ersten Klick zeigen",
    detail: "Bewertungen, Kontakt und Sicherheit sollten frueher sichtbar werden.",
    priority: "Wichtig",
  },
  {
    label: "Mobile Orientierung reduzieren",
    detail: "Auf kleinen Screens zaehlen Reihenfolge, Lesbarkeit und Button-Naehe besonders stark.",
    priority: "Chance",
  },
];

const statCards = [
  { label: "Sichtbarkeit", value: "SEO + AI" },
  { label: "Vertrauen", value: "Trust" },
  { label: "Nutzerfuehrung", value: "UX" },
  { label: "Conversion", value: "CTA" },
];

function planLabel(plan?: CheckoutPlan) {
  if (plan === "full") return "Vollanalyse nach dem Scan";
  if (plan === "premium") return "Premium-Report nach dem Scan";
  return "Kostenloser Einstieg";
}

function signalColor(tone: string) {
  if (tone === "risk") return "bg-rose-300/70";
  if (tone === "watch") return "bg-cyan-300/70";
  return "bg-emerald-300/70";
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function AnalyseDashboardEntry({
  initialUrl = "",
  initialPlan,
}: AnalyseDashboardEntryProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanIndex, setScanIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(84);
  const scoreRef = useRef(84);
  const isScanning = scanState === "scanning";
  const currentStep = scanSteps[scanIndex];
  const progress = isScanning ? Math.max(14, (scanIndex + 1) * 18) : 84;
  const visibleSignals = useMemo(
    () =>
      demoSignals.map((signal, index) => ({
        ...signal,
        value: isScanning ? [32, 47, 61, 74, 68][(scanIndex + index) % 5] : signal.value,
      })),
    [isScanning, scanIndex],
  );

  useEffect(() => {
    if (!isScanning) return;

    const timer = window.setInterval(() => {
      setScanIndex((index) => (index + 1) % scanSteps.length);
    }, 720);

    return () => window.clearInterval(timer);
  }, [isScanning]);

  useEffect(() => {
    const target = isScanning ? [18, 34, 51, 67, 79][scanIndex] : scanState === "error" ? 42 : 84;
    const start = scoreRef.current;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progressValue = Math.min(1, (now - startedAt) / 520);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      const next = Math.round(start + (target - start) * eased);
      scoreRef.current = next;
      setDisplayScore(next);
      if (progressValue < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [scanIndex, scanState, isScanning]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUrl = normalizeUrlInput(url);

    if (!normalizedUrl) {
      setError("Bitte gib eine gueltige URL ein.");
      setScanState("error");
      return;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Bitte gib eine gueltige Website-URL ein.");
      setScanState("error");
      return;
    }

    try {
      setUrl(normalizedUrl);
      setError("");
      setScanIndex(0);
      setScanState("scanning");

      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
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
      setError(submitError instanceof Error ? submitError.message : "Analyse konnte nicht gestartet werden.");
      setScanState("error");
    }
  }

  return (
    <section className="relative overflow-hidden px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_80%_24%,rgba(59,130,246,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center">
        <div className="pt-8 lg:pt-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
            {planLabel(initialPlan)}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.02]">
            Website eingeben. Analyse starten. Klarheit gewinnen.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Der Scanner prueft Sichtbarkeit, Vertrauen, Nutzerfuehrung und Conversion-Hebel. Du bekommst ein Ergebnis, das direkt zeigt, wo deine Website bremst.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] p-2 shadow-[0_24px_90px_-42px_rgba(34,211,238,0.5)] backdrop-blur-xl"
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label htmlFor="analyse-url" className="sr-only">
                Website URL
              </label>
              <input
                id="analyse-url"
                name="url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://deine-website.de"
                disabled={isScanning}
                className="min-h-14 min-w-0 rounded-xl border border-white/10 bg-slate-950/72 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 disabled:opacity-70 sm:min-h-16 sm:px-5"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-sm font-extrabold text-slate-950 shadow-[0_18px_50px_-24px_rgba(103,232,249,0.95)] transition hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-75 sm:min-h-16"
              >
                {isScanning ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />
                    Analyse laeuft
                  </>
                ) : (
                  "Website analysieren"
                )}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {["Keine Registrierung", "Ergebnis sofort sichtbar", "Screenshots inklusive", "Upgrade optional"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 pb-8 lg:pb-0">
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#020408]/95 shadow-[0_38px_140px_-62px_rgba(0,0,0,0.95),0_0_90px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-white/[0.018] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex gap-2" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-white/[0.16]" />
                  <span className="h-2 w-2 rounded-full bg-white/[0.1]" />
                  <span className="h-2 w-2 rounded-full bg-white/[0.06]" />
                </div>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  shophebel scanner / {url || "deine website"}
                </p>
              </div>
              <span className="w-fit rounded-md border border-cyan-300/15 bg-cyan-300/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-200">
                {isScanning ? currentStep : scanState === "error" ? "Eingabe pruefen" : "Live bereit"}
              </span>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.85fr)]">
              <div className="grid gap-4">
                <article className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.032] p-5 sm:p-6">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">
                        Analyse-Ueberblick
                      </p>
                      <div className="mt-4 flex items-end gap-3">
                        <p className="font-mono text-6xl font-semibold leading-none text-white tabular-nums sm:text-7xl">
                          {displayScore}
                        </p>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          /100 Klarheitsindex
                        </p>
                      </div>
                      <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                        {isScanning
                          ? "Die Analyse laeuft live. Sichtbare Signale werden gerade in konkrete Findings uebersetzt."
                          : "Beispielhafte Preview: Nach dem Start ersetzt Shophebel diese Werte durch echte Website-Signale."}
                      </p>
                    </div>

                    <div className="relative mx-auto grid h-32 w-32 shrink-0 place-items-center sm:mx-0">
                      <div className="absolute inset-0 rounded-full border border-cyan-200/10" />
                      <div className="absolute inset-3 rounded-full border border-white/10" />
                      <div className="absolute inset-7 rounded-full border border-white/[0.06]" />
                      <div className={`h-11 w-11 rounded-full border-2 ${isScanning ? "animate-spin border-cyan-300/20 border-t-cyan-200" : "border-cyan-200/25 bg-cyan-300/10"}`} />
                      {!isScanning ? <span className="absolute text-lg font-bold text-cyan-100">SH</span> : null}
                    </div>
                  </div>

                  <div className="mt-6 h-px w-full bg-white/[0.06]">
                    <div
                      className="h-px bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.55)] transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </article>

                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="rounded-xl border border-white/[0.07] bg-white/[0.028] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        Scan-Schritte
                      </p>
                      <span className="font-mono text-[10px] text-slate-600">{isScanning ? `${scanIndex + 1}/5` : "bereit"}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {scanSteps.map((step, index) => {
                        const active = index === scanIndex && isScanning;
                        const complete = isScanning && index < scanIndex;

                        return (
                          <div key={step} className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${active ? "bg-cyan-200" : complete ? "bg-emerald-300/70" : "bg-white/12"}`} />
                            <span className={`truncate text-xs ${active ? "text-cyan-100" : complete ? "text-slate-300" : "text-slate-600"}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="rounded-xl border border-white/[0.07] bg-white/[0.028] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Reibungssignale
                    </p>
                    <div className="mt-4 grid gap-3">
                      {visibleSignals.map((signal) => (
                        <div key={signal.label}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-slate-400">{signal.label}</span>
                            <span className="font-mono text-slate-600">{signal.value}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${signalColor(signal.tone)} transition-all duration-500`}
                              style={{ width: `${signal.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>

              <aside className="rounded-xl border border-white/[0.07] bg-white/[0.028] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">
                    Top Opportunities
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-slate-400">
                    Preview
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {demoLevers.map((lever, index) => (
                    <article key={lever.label} className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5 text-slate-200">
                            {isScanning && index > scanIndex % 3 ? "Signal wird geprueft" : lever.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {isScanning && index > scanIndex % 3 ? currentStep : lever.detail}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">
                          {lever.priority}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {statCards.map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/[0.055] bg-white/[0.022] p-3">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-300">{item.value}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
