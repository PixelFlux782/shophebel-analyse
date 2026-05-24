"use client";

import { useEffect, useState } from "react";

import { ScreenshotFallback } from "@/components/results/screenshot-fallback";

interface ResultScreenshotTeaserProps {
  src: string;
  initialFailed?: boolean;
}

export function ResultScreenshotTeaser({
  src,
  initialFailed = false,
}: ResultScreenshotTeaserProps) {
  const [failed, setFailed] = useState(initialFailed);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFailed(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [src]);

  if (failed) {
    return <ScreenshotFallback />;
  }

  return (
    <div className="mt-4 max-h-[22rem] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-100">
      <img
        src={src}
        alt="Screenshot-Teaser der analysierten Website"
        className="w-full object-cover object-top"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
