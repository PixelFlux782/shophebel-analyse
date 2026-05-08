"use client";

import { useState } from "react";
import Image from "next/image";

import { getSuggestionForHotspot, VisualHotspot, VisualHotspotTarget } from "@/lib/result-ui";
import { AiSuggestion, VisualMap } from "@/types/analysis";
import { HotspotSuggestionPopover } from "@/components/results/hotspot-suggestion-popover";

interface VisualOverlayProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  visualMap: VisualMap;
  hotspots: VisualHotspot[];
  target: VisualHotspotTarget;
  suggestions?: AiSuggestion[];
}

function getHotspotToneClasses(tone: VisualHotspot["tone"]) {
  if (tone === "good") {
    return {
      box: "border-emerald-500/80 bg-emerald-400/15",
      dot: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-800",
    };
  }

  if (tone === "problem") {
    return {
      box: "border-rose-500/80 bg-rose-400/15",
      dot: "bg-rose-500",
      badge: "bg-rose-100 text-rose-800",
    };
  }

  return {
    box: "border-amber-500/80 bg-amber-400/15",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
  };
}

export function VisualOverlay({
  imageSrc,
  imageAlt,
  title,
  visualMap,
  hotspots,
  target,
  suggestions,
}: VisualOverlayProps) {
  const [showHotspots, setShowHotspots] = useState(true);
  const baseWidth = target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth;
  const baseHeight = target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight;

  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {hotspots.length > 0
              ? "Die Markierungen zeigen Problemzonen, Verbesserungshebel und positive Signale direkt auf deiner Seite."
              : "Die Vorschau zeigt die sichtbare Seite ohne zusaetzliche Markierungen."}
          </p>
        </div>
        {hotspots.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowHotspots((current) => !current)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            {showHotspots ? "Markierungen ausblenden" : "Markierungen anzeigen"}
          </button>
        ) : null}
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.28)]">
        <div className="relative min-w-[42rem]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={Math.max(1200, Math.round(baseWidth))}
            height={Math.max(900, Math.round(baseHeight))}
            sizes="(max-width: 1024px) 100vw, 960px"
            className="h-auto w-full object-top"
            unoptimized
          />

          {showHotspots && hotspots.length > 0 ? (
            <div className="pointer-events-none absolute inset-0">
              {hotspots.map((hotspot) => {
                const tone = getHotspotToneClasses(hotspot.tone);
                const suggestion = getSuggestionForHotspot(suggestions, hotspot);

                return (
                  <div
                    key={hotspot.id}
                    className="group pointer-events-auto absolute"
                    style={{
                      left: `${(hotspot.x / baseWidth) * 100}%`,
                      top: `${(hotspot.y / baseHeight) * 100}%`,
                      width: `${(hotspot.width / baseWidth) * 100}%`,
                      height: `${(hotspot.height / baseHeight) * 100}%`,
                    }}
                  >
                    <div
                      className={`relative h-full w-full rounded-xl border-2 ${tone.box} shadow-[0_8px_24px_-18px_rgba(15,23,42,0.7)]`}
                    >
                      <div className="absolute left-2 top-2 flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${tone.dot}`} />
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.badge}`}
                        >
                          {hotspot.tone === "problem"
                            ? "Problem"
                            : hotspot.tone === "good"
                              ? "Staerke"
                              : "Hebel"}
                        </span>
                      </div>
                      <HotspotSuggestionPopover
                        hotspot={hotspot}
                        suggestion={suggestion}
                        toneClasses={{ dot: tone.dot, badge: tone.badge }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
