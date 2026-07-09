"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SuccessRedirectProps {
  analysisId: string;
  resultHref: string;
  plan: "full" | "premium";
}

const premiumSteps = [
  "Zahlung bestätigt",
  "Shopseiten werden erkannt",
  "Screenshots werden erstellt",
  "Analyse wird ausgewertet",
  "Report wird vorbereitet",
];

const stepTimings = [0, 4_000, 14_000, 30_000, 50_000];
const processingTimeout = 4 * 60_000;

export function SuccessRedirect({ analysisId, resultHref, plan }: SuccessRedirectProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (plan === "premium") return;

    const timeout = window.setTimeout(() => {
      setIsRedirecting(true);
      window.location.href = resultHref;
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [plan, resultHref]);

  useEffect(() => {
    if (plan !== "premium") return;

    const startedAt = Date.now();
    const controller = new AbortController();
    let retryTimeout: number | undefined;
    let stopped = false;
    const overallTimeout = window.setTimeout(() => {
      controller.abort();
      setHasTimedOut(true);
    }, processingTimeout);

    const updateStep = () => {
      const elapsed = Date.now() - startedAt;
      const nextStep = stepTimings.reduce(
        (current, timing, index) => (elapsed >= timing ? index : current),
        0,
      );
      setActiveStep(nextStep);
    };

    const stepInterval = window.setInterval(updateStep, 1000);

    const checkReport = async () => {
      if (stopped) return;

      if (Date.now() - startedAt >= processingTimeout) {
        controller.abort();
        setHasTimedOut(true);
        return;
      }

      try {
        const response = await fetch(
          `/api/premium-report/process?analysisId=${encodeURIComponent(analysisId)}`,
          {
            method: "POST",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as {
          status?: "payment_pending" | "ready";
        };

        if (!response.ok) {
          throw new Error("Premium-Report konnte nicht vorbereitet werden.");
        }

        if (payload.status === "ready") {
          stopped = true;
          setActiveStep(premiumSteps.length);
          setIsRedirecting(true);
          window.location.replace(resultHref);
          return;
        }

        retryTimeout = window.setTimeout(checkReport, 3000);
      } catch {
        if (controller.signal.aborted || stopped) return;
        retryTimeout = window.setTimeout(checkReport, 5000);
      }
    };

    void checkReport();

    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(stepInterval);
      window.clearTimeout(overallTimeout);
      if (retryTimeout) window.clearTimeout(retryTimeout);
    };
  }, [analysisId, plan, resultHref, retryKey]);

  if (plan === "premium") {
    return (
      <div className="mx-auto mt-9 max-w-xl text-left">
        <div
          className="rounded-[1.5rem] border border-slate-200/90 bg-slate-50/80 p-5 sm:p-6"
          aria-live="polite"
        >
          <ol className="space-y-1" aria-label="Fortschritt der Premium-Analyse">
            {premiumSteps.map((step, index) => {
              const isComplete = index < activeStep;
              const isActive = index === activeStep;

              return (
                <li key={step} className="flex min-h-12 items-center gap-4">
                  <span
                    className={[
                      "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors duration-700",
                      isComplete
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isActive
                          ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 bg-white text-slate-400",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {isComplete ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                    {isActive ? (
                      <span className="absolute inset-[-5px] -z-10 animate-pulse rounded-full bg-cyan-100" />
                    ) : null}
                  </span>
                  <span
                    className={[
                      "text-sm sm:text-base",
                      isComplete || isActive
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-500",
                    ].join(" ")}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {hasTimedOut ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">
              Die Analyse dauert ungewöhnlich lange. Bitte lade die Seite neu oder öffne deinen
              Report später erneut.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setHasTimedOut(false);
                  setActiveStep(0);
                  setRetryKey((key) => key + 1);
                }}
                className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800"
              >
                Erneut prüfen
              </button>
              <Link
                href={resultHref}
                className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-center font-bold text-slate-800 transition hover:bg-amber-100"
              >
                Report öffnen
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-3 text-center text-sm font-medium text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-600" aria-hidden="true" />
            {isRedirecting
              ? "Dein Report ist bereit. Er wird jetzt geöffnet."
              : "Bitte dieses Fenster geöffnet lassen."}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            href={resultHref}
            className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800"
          >
            Report direkt öffnen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Link
        href={resultHref}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-base font-bold text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
      >
        Zur freigeschalteten Analyse
      </Link>
      <div className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-500" />
        {isRedirecting
          ? "Weiterleitung läuft..."
          : "Automatische Weiterleitung in wenigen Sekunden"}
      </div>
    </div>
  );
}
