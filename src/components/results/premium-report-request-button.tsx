"use client";

import { useState } from "react";

interface PremiumReportRequestButtonProps {
  analysisId: string;
  url: string;
  label?: string;
  className?: string;
}

export function PremiumReportRequestButton({
  analysisId,
  url,
  label = "Premium-Report für 49 EUR anfragen",
  className = "",
}: PremiumReportRequestButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleRequest() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          analysisId,
          url,
          productType: "premium_report",
          topic: "Premium Report",
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Anfrage konnte nicht gespeichert werden.");
      }

      setStatus("success");
      setMessage("Anfrage gespeichert. Wir melden uns mit dem nächsten Schritt zum Premium-Report.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Anfrage konnte nicht gespeichert werden.");
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
        {status === "loading" ? "Anfrage wird gespeichert..." : status === "success" ? "Report angefragt" : label}
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
