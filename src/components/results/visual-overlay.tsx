"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSuggestionForHotspot, VisualHotspot, VisualHotspotTarget } from "@/lib/result-ui";
import { AiSuggestion, VisualMap } from "@/types/analysis";
import {
  ScreenshotLightbox,
  ScreenshotLightboxNote,
} from "@/components/results/screenshot-lightbox";

interface VisualOverlayProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  visualMap: VisualMap;
  hotspots: VisualHotspot[];
  target: VisualHotspotTarget;
  suggestions?: AiSuggestion[];
  notes?: ScreenshotLightboxNote[];
  variant?: "compact" | "premium";
}

function buildHotspotNotes(
  hotspots: VisualHotspot[],
  suggestions: AiSuggestion[] | undefined,
  variant: "compact" | "premium",
) {
  const limit = variant === "premium" ? 10 : 4;

  return hotspots.slice(0, limit).map((hotspot) => {
    const suggestion = getSuggestionForHotspot(suggestions, hotspot);
    const category =
      hotspot.label?.includes("Oberer") ? "Above the Fold" :
      hotspot.title.toLowerCase().includes("cta") ? "CTA Klarheit" :
      hotspot.title.toLowerCase().includes("trust") || hotspot.title.toLowerCase().includes("vertrauen") ? "Vertrauen" :
      "Visuelle Hierarchie";
    const priority = hotspot.tone === "problem" ? "kritisch" : hotspot.tone === "improvement" ? "wichtig" : "chance";

    return {
      id: hotspot.id,
      hotspotId: hotspot.id,
      title: hotspot.label ? `${hotspot.label}: ${hotspot.title}` : hotspot.title,
      text: suggestion?.summary ?? hotspot.description,
      category,
      badge: hotspot.tone === "problem" ? "Kritisch" : hotspot.tone === "good" ? "Chance" : "Wichtig",
      priority,
      problem: hotspot.description,
      impact: priority === "kritisch"
        ? "Besucher koennen an dieser Stelle Vertrauen verlieren oder den naechsten Schritt uebersehen."
        : "Der Bereich verschenkt Orientierung und macht die Entscheidung unnoetig schwerer.",
      recommendation: suggestion?.actionSteps?.[0] ?? suggestion?.summary ?? "Den sichtbaren Bereich klarer auf Nutzen, Vertrauen und naechsten Schritt ausrichten.",
    } satisfies ScreenshotLightboxNote;
  });
}

function mergeNotes(
  primaryNotes: ScreenshotLightboxNote[] | undefined,
  hotspotNotes: ScreenshotLightboxNote[],
) {
  const seen = new Set<string>();
  return [...(primaryNotes ?? []), ...hotspotNotes].filter((note) => {
    const key = `${note.category ?? ""}:${note.title}:${note.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 10);
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
  notes,
  variant = "compact",
}: VisualOverlayProps) {
  const [showHotspots, setShowHotspots] = useState(true);
  const [showHintCards, setShowHintCards] = useState(true);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"alle" | "kritisch" | "wichtig" | "chance">("alle");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const mappedWidth = target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth;
  const mappedHeight = target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight;
  const baseWidth = mappedWidth > 0 ? mappedWidth : naturalSize?.width ?? 1280;
  const baseHeight = mappedHeight > 0 ? mappedHeight : naturalSize?.height ?? 720;
  const aspectRatio = `${baseWidth} / ${baseHeight}`;
  const lightboxNotes = useMemo(
    () => mergeNotes(notes, buildHotspotNotes(hotspots, suggestions, variant)),
    [hotspots, notes, suggestions, variant],
  );
  const filteredNotes = useMemo(
    () => lightboxNotes.filter((note) => activeFilter === "alle" || note.priority === activeFilter || note.badge?.toLowerCase() === activeFilter),
    [activeFilter, lightboxNotes],
  );
  const visibleHotspots = useMemo(() => {
    if (activeFilter === "alle") return hotspots;

    const visibleIds = new Set(
      filteredNotes
        .map((note) => note.hotspotId ?? note.id)
        .filter((id): id is string => Boolean(id)),
    );

    return hotspots.filter((hotspot) => visibleIds.has(hotspot.id));
  }, [activeFilter, filteredNotes, hotspots]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setImageLoaded(false);
      setImageFailed(false);
      setNaturalSize(null);
      setShowHintCards(true);
      setShowHotspots(true);
      setActiveHotspotId(null);
      setActiveFilter("alle");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [imageSrc]);

  const focusNote = (hotspotId: string) => {
    setActiveHotspotId(hotspotId);
    setShowHintCards(true);
    window.setTimeout(() => {
      noteRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {variant === "premium"
              ? "Marker und Hinweise zeigen konkret, wo Vertrauen, Orientierung oder der naechste Klick verloren gehen."
              : "Kompakte Markierungen zeigen die wichtigsten visuellen Reibungspunkte."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hotspots.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHotspots((current) => !current)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              {showHotspots ? "Markierungen ausblenden" : "Markierungen anzeigen"}
            </button>
          ) : null}
          {lightboxNotes.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHintCards((current) => !current)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              {showHintCards ? "Hinweise ausblenden" : "Hinweise anzeigen"}
            </button>
          ) : null}
          {!imageFailed ? (
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="rounded-full border border-slate-900/10 bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-[0_14px_36px_-20px_rgba(15,23,42,0.8)] transition hover:border-cyan-300/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            >
              Vollansicht
            </button>
          ) : null}
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${showHintCards && lightboxNotes.length > 0 ? "xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
        <div className="relative overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.28)]">
          <div className="relative w-full overflow-hidden bg-slate-100" style={{ aspectRatio }}>
            {!imageFailed ? (
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="lazy"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setNaturalSize({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                  });
                  setImageLoaded(true);
                }}
                onError={() => {
                  setImageFailed(true);
                  setImageLoaded(false);
                }}
                className="absolute inset-0 h-full w-full object-fill object-top"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="w-2/3 max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Screenshot nicht geladen
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Die Analyse ist vorhanden, aber die visuelle Vorschau konnte nicht angezeigt werden.
                  </p>
                </div>
              </div>
            )}

            {showHotspots && imageLoaded && !imageFailed && hotspots.length > 0 ? (
              <div className="pointer-events-none absolute inset-0">
                {visibleHotspots.map((hotspot, index) => {
                  const tone = getHotspotToneClasses(hotspot.tone);
                  const left = Math.max(1.2, Math.min(96, (hotspot.x / baseWidth) * 100));
                  const top = Math.max(1.2, Math.min(96, (hotspot.y / baseHeight) * 100));
                  const width = Math.max(4, Math.min(98 - left, (hotspot.width / baseWidth) * 100));
                  const height = Math.max(4, Math.min(98 - top, (hotspot.height / baseHeight) * 100));
                  const labelRight = left > 72 ? "0" : "auto";
                  const labelLeft = left > 72 ? "auto" : "0";
                  const labelBottom = top > 76 ? "100%" : "auto";
                  const labelTop = top > 76 ? "auto" : "100%";
                  const isActive = activeHotspotId === hotspot.id;

                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      onClick={() => focusNote(hotspot.id)}
                      className={`group pointer-events-auto absolute rounded-xl text-left outline-none transition ${
                        isActive ? "z-40 ring-4 ring-cyan-300/40" : "z-20"
                      }`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      aria-label={`Marker ${index + 1}: ${hotspot.title}`}
                    >
                      <div className={`relative h-full w-full rounded-xl border-2 ${tone.box} shadow-[0_8px_24px_-18px_rgba(15,23,42,0.7)]`}>
                        <div className="absolute left-2 top-2 z-30 flex items-center gap-2">
                          <span className={`grid h-7 w-7 place-items-center rounded-full border border-white text-xs font-bold text-white shadow-lg ${tone.dot}`}>
                            {index + 1}
                          </span>
                          <span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow sm:inline-flex ${tone.badge}`}>
                            {hotspot.tone === "problem" ? "Problem" : hotspot.tone === "good" ? "Chance" : "Wichtig"}
                          </span>
                        </div>
                        <span
                          className="absolute z-30 mt-2 hidden max-w-[13rem] rounded-xl border border-slate-200 bg-white/98 px-3 py-2 text-xs font-bold leading-5 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] group-hover:block group-focus-visible:block"
                          style={{ left: labelLeft, right: labelRight, top: labelTop, bottom: labelBottom }}
                        >
                          {hotspot.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {showHintCards && lightboxNotes.length > 0 ? (
          <div className="max-h-[42rem] overflow-y-auto rounded-[1.2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                Hinweise
              </p>
              {variant === "premium" ? (
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Arbeitsansicht
                </span>
              ) : null}
            </div>
            {variant === "premium" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["alle", "kritisch", "wichtig", "chance"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                      activeFilter === filter
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-3 grid gap-3">
              {filteredNotes.map((note, index) => {
                const hotspotId = note.hotspotId ?? note.id;

                return (
                  <article
                    key={`${note.title}-${index}`}
                    ref={(element) => {
                      if (hotspotId) noteRefs.current[hotspotId] = element;
                    }}
                    onClick={() => hotspotId ? setActiveHotspotId(hotspotId) : undefined}
                    className={`rounded-2xl border p-4 transition ${
                      hotspotId && activeHotspotId === hotspotId
                        ? "border-cyan-300 bg-cyan-50 shadow-[0_16px_50px_-38px_rgba(8,145,178,0.8)]"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                          {note.category ?? "Visual Audit"}
                        </p>
                        <h3 className="mt-2 text-sm font-bold text-slate-950">{note.title}</h3>
                      </div>
                      {note.badge ? (
                        <span className="shrink-0 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          {note.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{note.text}</p>
                    {variant === "premium" && (note.problem || note.impact || note.recommendation) ? (
                      <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700">
                        {note.problem ? <p><strong className="text-slate-950">Was ist das Problem?</strong> {note.problem}</p> : null}
                        {note.impact ? <p><strong className="text-slate-950">Warum kostet das?</strong> {note.impact}</p> : null}
                        {note.recommendation ? <p><strong className="text-slate-950">Was aendern?</strong> {note.recommendation}</p> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <ScreenshotLightbox
        images={[{
          src: imageSrc,
          alt: imageAlt,
          title,
          notes: lightboxNotes,
          visualMap,
          hotspots,
          target,
        }]}
        currentIndex={0}
        isOpen={isLightboxOpen && !imageFailed}
        onClose={() => setIsLightboxOpen(false)}
        onSelect={() => undefined}
      />
    </article>
  );
}
