"use client";

import { useState } from "react";

import { buildCheckoutRequestPayload, CheckoutPlan } from "@/lib/checkout-client";

interface CheckoutButtonProps {
  analysisId: string;
  label?: string;
  className?: string;
  plan?: CheckoutPlan;
}

export function CheckoutButton({
  analysisId,
  label = "Vollanalyse fuer 5 EUR freischalten",
  className = "",
  plan = "full",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildCheckoutRequestPayload({
          analysisId,
          productType: plan === "full" ? "full_analysis" : "premium_report",
          plan,
        })),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout konnte nicht gestartet werden.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout konnte nicht gestartet werden.";
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`inline-flex items-center rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {loading ? "Weiterleitung..." : label}
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
