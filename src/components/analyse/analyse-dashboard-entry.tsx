"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { buildCheckoutRequestPayload, CheckoutPlan } from "@/lib/checkout-client";
import { AnalysisResult } from "@/types/analysis";

interface AnalyseDashboardEntryProps {
  initialUrl?: string;
  initialPlan?: CheckoutPlan;
}

type ScanState = "idle" | "scanning" | "error";
type PanelState = "queued" | "running" | "complete";

const analysisStages = [
  {
    label: "Scanning visual hierarchy...",
    detail: "Capturing above-the-fold structure, headline weight and CTA position.",
    progress: 13,
    targetScore: 24,
  },
  {
    label: "Detecting conversion friction...",
    detail: "Checking purchase paths, action clarity and decision blockers.",
    progress: 28,
    targetScore: 39,
  },
  {
    label: "Analyzing trust architecture...",
    detail: "Mapping social proof, contact signals, legal confidence and risk cues.",
    progress: 44,
    targetScore: 53,
  },
  {
    label: "Evaluating mobile experience...",
    detail: "Comparing mobile readability, fold priority and thumb-zone actions.",
    progress: 61,
    targetScore: 66,
  },
  {
    label: "Checking AI visibility...",
    detail: "Reading semantic clarity, entity signals and answer-engine readiness.",
    progress: 78,
    targetScore: 76,
  },
  {
    label: "Building intelligence report...",
    detail: "Prioritizing findings into revenue levers and next actions.",
    progress: 92,
    targetScore: 84,
  },
];

const intelligencePanels = [
  {
    title: "Visuelle Analyse",
    metric: "Hierarchy map",
    finding: "Hero, CTA density and first-screen clarity are being mapped.",
    accent: "bg-sky-300",
  },
  {
    title: "Conversion Signals",
    metric: "Friction model",
    finding: "Primary actions, form effort and decision paths are compared.",
    accent: "bg-emerald-300",
  },
  {
    title: "AI Visibility",
    metric: "Entity layer",
    finding: "Offer language, topical signals and crawlable context are checked.",
    accent: "bg-violet-300",
  },
  {
    title: "Mobile UX",
    metric: "Viewport pass",
    finding: "Fold sequence, spacing and action reach are evaluated for mobile.",
    accent: "bg-cyan-300",
  },
  {
    title: "Trust Layer",
    metric: "Confidence graph",
    finding: "Reviews, contact routes, guarantees and risk reducers are located.",
    accent: "bg-amber-300",
  },
  {
    title: "Technical Scan",
    metric: "Runtime signals",
    finding: "Indexability, response behavior and rendered structure are validated.",
    accent: "bg-rose-300",
  },
];

const scanMarkers = [
  { label: "CTA", top: "38%", left: "16%", delay: 0.1 },
  { label: "Trust", top: "64%", left: "69%", delay: 0.28 },
  { label: "Hero", top: "24%", left: "51%", delay: 0.46 },
  { label: "Mobile", top: "76%", left: "33%", delay: 0.64 },
];

function planLabel(plan?: CheckoutPlan) {
  if (plan === "full") return "Full analysis pipeline";
  if (plan === "premium") return "Premium report pipeline";
  return "Live website intelligence";
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatTarget(value: string) {
  if (!value) return "waiting-for-target";
  try {
    return new URL(normalizeUrlInput(value)).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./, "") || "target";
  }
}

function getPanelState(index: number, scanIndex: number, isScanning: boolean): PanelState {
  if (!isScanning) return index < 2 ? "complete" : "queued";
  if (index < scanIndex) return "complete";
  if (index === scanIndex) return "running";
  return "queued";
}

function panelProgress(state: PanelState, scanIndex: number, index: number) {
  if (state === "complete") return 100;
  if (state === "running") return 42 + ((scanIndex + index) % 4) * 11;
  return 0;
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
  const currentStage = analysisStages[scanIndex] ?? analysisStages[analysisStages.length - 1];
  const progress = isScanning ? currentStage.progress : scanState === "error" ? 22 : 0;
  const targetHost = formatTarget(url);
  const activeSystems = useMemo(
    () => [
      { label: "renderer", value: isScanning ? "capturing" : "standby" },
      { label: "crawler", value: isScanning ? "reading DOM" : "ready" },
      { label: "vision", value: isScanning ? "mapping UI" : "ready" },
      { label: "model", value: isScanning ? "scoring" : "idle" },
    ],
    [isScanning],
  );

  useEffect(() => {
    if (!isScanning) return;

    const timer = window.setInterval(() => {
      setScanIndex((index) => Math.min(index + 1, analysisStages.length - 1));
    }, 980);

    return () => window.clearInterval(timer);
  }, [isScanning]);

  useEffect(() => {
    const target = isScanning ? currentStage.targetScore : scanState === "error" ? 38 : 84;
    const start = scoreRef.current;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progressValue = Math.min(1, (now - startedAt) / 560);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      const next = Math.round(start + (target - start) * eased);
      scoreRef.current = next;
      setDisplayScore(next);
      if (progressValue < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [currentStage.targetScore, scanState, isScanning]);

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
    <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-[#07090d] px-3 py-4 text-slate-100 sm:px-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_32%),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:auto,64px_64px,64px_64px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="grid gap-3 border-b border-white/[0.08] pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.44fr)] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${isScanning ? "bg-emerald-300" : scanState === "error" ? "bg-rose-300" : "bg-slate-500"}`} />
                {planLabel(initialPlan)}
              </span>
              <span className="inline-flex h-7 max-w-full items-center rounded-md border border-white/10 bg-black/20 px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                target / <span className="ml-1 truncate text-slate-300">{targetHost}</span>
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Website Analysis Operating System
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
              Live-Erfassung für visuelle Hierarchie, Anfrage-Reibung, Vertrauen, Mobile UX und KI-Sichtbarkeit.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2">
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
                className="h-11 min-w-0 rounded-md border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/15 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-slate-950 shadow-[0_16px_38px_-24px_rgba(255,255,255,0.7)] hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#07090d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isScanning ? "Analyzing" : "Start analysis"}
              </button>
            </div>
            {error ? (
              <p className="mt-2 rounded-md border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs leading-5 text-rose-100">
                {error}
              </p>
            ) : null}
          </form>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(21rem,0.52fr)]">
          <div className="grid gap-4">
            <section className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0e13] shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]">
              <div className="flex flex-col gap-3 border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    live analysis runtime
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentStage.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="mt-1 truncate text-sm font-semibold text-white sm:text-base"
                    >
                      {isScanning ? currentStage.label : scanState === "error" ? "Input validation stopped" : "System ready for target"}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {activeSystems.map((system) => (
                    <div key={system.label} className="rounded-md border border-white/[0.08] bg-black/20 px-2.5 py-1.5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">{system.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300">{system.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.7fr)]">
                <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#11151c]">
                  <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#080b10]/88 px-3 py-2 backdrop-blur">
                    <p className="truncate font-mono text-[10px] text-slate-500">
                      viewport-capture://{targetHost}
                    </p>
                    <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
                      {isScanning ? `${progress}%` : "standby"}
                    </span>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{ opacity: isScanning ? 1 : 0.64, y: isScanning ? 0 : 10 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="absolute inset-0 pt-10"
                  >
                    <div className="mx-auto mt-6 w-[88%] overflow-hidden rounded-md border border-slate-700/70 bg-slate-100 shadow-[0_32px_80px_-55px_rgba(255,255,255,0.35)]">
                      <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-white px-3">
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        <span className="ml-2 h-3 w-36 rounded bg-slate-200" />
                      </div>
                      <div className="grid gap-4 bg-white p-5 md:grid-cols-[minmax(0,1fr)_13rem]">
                        <div>
                          <div className="h-7 w-3/4 rounded bg-slate-900" />
                          <div className="mt-3 h-3 w-5/6 rounded bg-slate-300" />
                          <div className="mt-2 h-3 w-2/3 rounded bg-slate-300" />
                          <div className="mt-5 flex gap-2">
                            <div className="h-9 w-28 rounded bg-slate-950" />
                            <div className="h-9 w-24 rounded border border-slate-300 bg-white" />
                          </div>
                        </div>
                        <div className="hidden rounded border border-slate-200 bg-slate-50 md:block" />
                      </div>
                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-5">
                        <div className="h-16 rounded border border-slate-200 bg-white" />
                        <div className="h-16 rounded border border-slate-200 bg-white" />
                        <div className="h-16 rounded border border-slate-200 bg-white" />
                      </div>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {isScanning ? (
                      <>
                        <motion.div
                          initial={{ y: "-18%", opacity: 0 }}
                          animate={{ y: "112%", opacity: [0, 1, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 top-0 z-30 h-24 border-y border-sky-300/30 bg-sky-300/[0.055]"
                        />
                        <div className="absolute inset-0 z-20 bg-[linear-gradient(180deg,transparent_0,rgba(255,255,255,0.045)_50%,transparent_100%)] bg-[length:100%_6px]" />
                        {scanMarkers.map((marker, index) => (
                          <motion.div
                            key={marker.label}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: scanIndex >= Math.min(index + 1, analysisStages.length - 1) ? 1 : 0.2, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: marker.delay, duration: 0.25 }}
                            className="absolute z-40"
                            style={{ top: marker.top, left: marker.left }}
                          >
                            <div className="relative">
                              <span className="absolute -inset-2 rounded-full border border-sky-300/25" />
                              <span className="grid h-7 w-7 place-items-center rounded-full border border-sky-200/70 bg-[#071018]/85 font-mono text-[9px] text-sky-100 shadow-[0_0_24px_rgba(125,211,252,0.22)]">
                                {index + 1}
                              </span>
                              <span className="absolute left-8 top-0 whitespace-nowrap rounded border border-white/10 bg-[#071018]/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-300">
                                {marker.label}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </>
                    ) : null}
                  </AnimatePresence>
                </div>

                <aside className="grid content-start gap-3">
                  <div className="rounded-lg border border-white/[0.08] bg-black/20 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">intelligence score</p>
                        <p className="mt-2 font-mono text-5xl font-semibold leading-none text-white tabular-nums">
                          {displayScore}
                          <span className="text-base text-slate-600">/100</span>
                        </p>
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                        {isScanning ? "calibrating" : "preview"}
                      </span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      {isScanning ? currentStage.detail : "Start the analysis to replace the preview state with live website signals."}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/[0.08] bg-black/20 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">stage sequence</p>
                    <div className="mt-3 grid gap-2">
                      {analysisStages.map((stage, index) => {
                        const active = isScanning && index === scanIndex;
                        const complete = isScanning && index < scanIndex;

                        return (
                          <div key={stage.label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                            <span className={`mt-1 h-2 w-2 rounded-full ${active ? "bg-white" : complete ? "bg-emerald-300" : "bg-white/14"}`} />
                            <span className={`truncate text-xs ${active ? "text-white" : complete ? "text-slate-300" : "text-slate-600"}`}>
                              {stage.label.replace("...", "")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {intelligencePanels.map((panel, index) => {
                const state = getPanelState(index, scanIndex, isScanning);
                const value = panelProgress(state, scanIndex, index);

                return (
                  <motion.article
                    key={panel.title}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
                    className="min-h-40 rounded-lg border border-white/[0.08] bg-[#0b0e13] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{panel.title}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">{panel.metric}</p>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${state === "complete" ? panel.accent : state === "running" ? "bg-white" : "bg-white/14"}`} />
                    </div>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={false}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className={`h-full rounded-full ${state === "complete" ? panel.accent : "bg-white"}`}
                      />
                    </div>

                    <AnimatePresence mode="wait">
                      {state === "queued" ? (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-5 grid gap-2"
                        >
                          <div className="h-2.5 w-11/12 rounded bg-white/[0.07]" />
                          <div className="h-2.5 w-4/5 rounded bg-white/[0.05]" />
                          <div className="h-2.5 w-2/3 rounded bg-white/[0.04]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="mt-5"
                        >
                          <p className="text-xs leading-5 text-slate-400">{panel.finding}</p>
                          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                            <span className={state === "complete" ? "text-emerald-300" : "text-white"}>{state}</span>
                            <span className="text-slate-600">{value}%</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </section>
          </div>

          <aside className="grid content-start gap-4">
            <section className="rounded-lg border border-white/[0.08] bg-[#0b0e13] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">system feedback</p>
                <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  live log
                </span>
              </div>
              <div className="mt-4 grid gap-2 font-mono text-[11px] leading-5">
                {analysisStages.slice(0, Math.max(2, scanIndex + 1)).map((stage, index) => (
                  <motion.div
                    key={stage.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22 }}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-600">{`00:${String(index * 3 + 4).padStart(2, "0")}`}</span>
                    <span className={isScanning && index === scanIndex ? "text-white" : "text-slate-500"}>
                      {stage.label.replace("...", "")}
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/[0.08] bg-[#0b0e13] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">detected work queue</p>
              <div className="mt-4 grid gap-3">
                {["Above-the-fold clarity", "Primary CTA contrast", "Review proof placement", "Mobile purchase path"].map((item, index) => {
                  const visible = isScanning && scanIndex >= index + 1;

                  return (
                    <motion.div
                      key={item}
                      initial={false}
                      animate={{ opacity: visible ? 1 : 0.42 }}
                      className="rounded-md border border-white/[0.07] bg-black/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-300">{item}</p>
                        <span className="font-mono text-[10px] text-slate-600">{visible ? "found" : "pending"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
