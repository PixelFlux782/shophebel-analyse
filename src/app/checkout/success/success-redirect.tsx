"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SuccessRedirectProps {
  resultHref: string;
  plan: "full" | "premium";
}

export function SuccessRedirect({ resultHref, plan }: SuccessRedirectProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsRedirecting(true);
      window.location.href = resultHref;
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [resultHref]);

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Link
        href={resultHref}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-base font-bold text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
      >
        {plan === "full" ? "Zur freigeschalteten Analyse" : "Zum Premium-Report"}
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
