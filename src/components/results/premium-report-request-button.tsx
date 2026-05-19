"use client";

import { useState } from "react";

import { buildCheckoutRequestPayload } from "@/lib/checkout-client";

interface PremiumReportRequestButtonProps {
  analysisId: string;
  url: string;
  label?: string;
  className?: string;
}

export function PremiumReportRequestButton({
  analysisId,
  url,
  label = "Premium Analyse fuer 49 EUR starten",
  className = "",
}: PremiumReportRequestButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  void url;

  async function handleRequest() {
    setStatus("loading");
    setMessage("");

    try {
      if (!analysisId) {
        throw new Error("Keine Analyse-ID für den Checkout vorhanden.");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildCheckoutRequestPayload({
          analysisId,
          productType: "premium_report",
          plan: "premium",
        })),
      });

      const payload = (await response.json()) as { url?: string; error?: string; demo?: boolean };

      if (!response.ok || !payload.url || payload.demo) {
        console.error("[premium-report-checkout] Checkout konnte nicht gestartet werden.", {
          status: response.status,
          error: payload.error,
          hasUrl: Boolean(payload.url),
          demo: Boolean(payload.demo),
        });
        throw new Error(payload.error || "Checkout konnte nicht gestartet werden.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      console.error("[premium-report-checkout] Checkout request failed.", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Checkout konnte nicht gestartet werden.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={status === "loading" || status === "success"}
        className={`inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 text-base font-bold text-slate-950 shadow-[0_18px_42px_-24px_rgba(34,211,238,0.85)] hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {status === "loading" ? "Checkout wird vorbereitet..." : status === "success" ? "Report angefragt" : label}
      </button>
      {message ? (
        <p
          className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
