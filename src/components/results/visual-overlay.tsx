"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSuggestionForHotspot, VisualHotspot, VisualHotspotTarget } from "@/lib/result-ui";
import { AiSuggestion, VisualMap } from "@/types/analysis";
import {
  ScreenshotLightbox,
  ScreenshotLightboxNote,
} from "@/components/results/screenshot-lightbox";
import {
  isLayerVisible,
  layerAccentClasses,
  normalizeVisualLayer,
  normalizeVisualSeverity,
  planLimits,
  priorityFromSeverity,
  severityClasses,
  severityLabel,
  VISUAL_LAYERS,
  VisualLayerFilter,
  VisualPlan,
} from "@/components/results/visual-intelligence-model";

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
  plan?: VisualPlan;
}

function getBoundedHotspotBox(hotspot: VisualHotspot, baseWidth: number, baseHeight: number) {
  const rawLeft = (hotspot.x / baseWidth) * 100;
  const rawTop = (hotspot.y / baseHeight) * 100;
  const rawWidth = (hotspot.width / baseWidth) * 100;
  const rawHeight = (hotspot.height / baseHeight) * 100;
  const left = Math.max(1.25, Math.min(94, rawLeft));
  const top = Math.max(1.25, Math.min(94, rawTop));
  const width = Math.max(4.5, Math.min(98 - left, rawWidth));
  const height = Math.max(4.5, Math.min(98 - top, rawHeight));

  return { left, top, width, height };
}

function getNoteMeta(note: ScreenshotLightboxNote) {
  const layer = note.layer ?? normalizeVisualLayer(note.category, note.title, note.text);
  const severity = note.severity ?? normalizeVisualSeverity(note.badge, note.priority);

  return { layer, severity };
}

function buildHotspotNotes(
  hotspots: VisualHotspot[],
  suggestions: AiSuggestion[] | undefined,
): ScreenshotLightboxNote[] {
  return hotspots.map((hotspot, index) => {
    const suggestion = getSuggestionForHotspot(suggestions, hotspot);
    const layer = normalizeVisualLayer(hotspot.title, hotspot.description, hotspot.label);
    const severity = normalizeVisualSeverity(hotspot.tone);
    const isCritical = severity === "critical";

    return {
      id: hotspot.id,
      hotspotId: hotspot.id,
      title: hotspot.label ? `${hotspot.label}: ${hotspot.title}` : hotspot.title,
      text: suggestion?.summary ?? hotspot.description,
      category: layer,
      layer,
      severity,
      badge: severityLabel[severity],
      priority: priorityFromSeverity(severity),
      problem: hotspot.description,
      businessImpact: isCritical
        ? "Diese Zone liegt im Entscheidungsfluss und kann Vertrauen, Orientierung oder den nächsten Klick abbremsen."
        : "Der Bereich kann klarer führen und die Aufmerksamkeit stärker auf den nächsten sinnvollen Schritt lenken.",
      action: suggestion?.actionSteps?.[0] ?? "Elemente in diesem Bereich klarer priorisieren, visuelle Konkurrenz reduzieren und den nächsten Schritt eindeutiger machen.",
      unlockLabel: index > 1 ? "Weitere Detailtiefe in der Vollanalyse" : undefined,
    };
  });
}

function mergeNotes(primaryNotes: ScreenshotLightboxNote[] | undefined, hotspotNotes: ScreenshotLightboxNote[]) {
  const seen = new Set<string>();

  return [...hotspotNotes, ...(primaryNotes ?? [])].filter((note) => {
    const key = `${note.hotspotId ?? note.id ?? ""}:${note.title}:${note.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function lockedNotes(plan: VisualPlan): ScreenshotLightboxNote[] {
  if (plan !== "free") {
    return [];
  }

  return [
    {
      title: "Vollständige visuelle Analyse",
      text: "Alle erkannten visuellen Reibungspunkte mit vollständiger Diagnose und konkreter Priorisierung.",
      layer: "UX",
      severity: "important",
      locked: true,
      unlockLabel: "In der 5 EUR Analyse freischalten",
    },
    {
      title: "Attention Flow",
      text: "Wie der Blick vom ersten Eindruck zum nächsten Klick geführt wird und wo Aufmerksamkeit verloren geht.",
      layer: "Conversion",
      severity: "important",
      locked: true,
      unlockLabel: "In der 5 EUR Analyse freischalten",
    },
    {
      title: "Revenue Impact",
      text: "Welche sichtbaren Stellen wahrscheinlich Anfrage-, Kauf- oder Kontaktbereitschaft bremsen.",
      layer: "Trust",
      severity: "critical",
      locked: true,
      unlockLabel: "In der 5 EUR Analyse freischalten",
    },
    {
      title: "Mobile Friction",
      text: "Mobile Orientierungskosten, Button-Abstaende und Reihenfolge im kleinen Viewport.",
      layer: "Mobile",
      severity: "important",
      locked: true,
      unlockLabel: "In der 5 EUR Analyse freischalten",
    },
  ];
}

function planLabel(plan: VisualPlan, target: VisualHotspotTarget) {
  if (plan === "free") return "Free Preview";
  if (plan === "full") return target === "viewport" ? "Desktop / Vollanalyse" : "Gesamtansicht / Vollanalyse";
  return target === "viewport" ? "Desktop / Premium" : "Gesamtansicht / Premium";
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
  plan,
}: VisualOverlayProps) {
  const resolvedPlan: VisualPlan = plan ?? (variant === "premium" ? "premium" : "full");
  const limits = planLimits(resolvedPlan);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showHintCards, setShowHintCards] = useState(true);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<VisualLayerFilter>("all");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mappedWidth = target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth;
  const mappedHeight = target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight;
  const baseWidth = mappedWidth > 0 ? mappedWidth : naturalSize?.width ?? 1280;
  const baseHeight = mappedHeight > 0 ? mappedHeight : naturalSize?.height ?? 720;

  const displayHotspots = useMemo(() => hotspots.slice(0, limits.hotspots), [hotspots, limits.hotspots]);
  const intelligenceNotes = useMemo(
    () => mergeNotes(notes, buildHotspotNotes(displayHotspots, suggestions)).slice(0, limits.notes),
    [displayHotspots, limits.notes, notes, suggestions],
  );
  const allNotes = useMemo(
    () => [...intelligenceNotes, ...lockedNotes(resolvedPlan)],
    [intelligenceNotes, resolvedPlan],
  );
  const noteByHotspotId = useMemo(() => {
    const map = new Map<string, ScreenshotLightboxNote>();
    intelligenceNotes.forEach((note) => {
      const id = note.hotspotId ?? note.id;
      if (id) map.set(id, note);
    });
    return map;
  }, [intelligenceNotes]);
  const filteredNotes = useMemo(
    () => allNotes.filter((note) => isLayerVisible(getNoteMeta(note).layer, activeLayer)),
    [activeLayer, allNotes],
  );
  const visibleHotspots = useMemo(() => {
    if (activeLayer === "all") return displayHotspots;

    return displayHotspots.filter((hotspot) => {
      const note = noteByHotspotId.get(hotspot.id);
      const layer = note ? getNoteMeta(note).layer : normalizeVisualLayer(hotspot.title, hotspot.description);
      return isLayerVisible(layer, activeLayer);
    });
  }, [activeLayer, displayHotspots, noteByHotspotId]);
  const activeHotspot = visibleHotspots.find((hotspot) => hotspot.id === activeHotspotId);
  const activeBox = activeHotspot ? getBoundedHotspotBox(activeHotspot, baseWidth, baseHeight) : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setImageLoaded(false);
      setImageFailed(false);
      setNaturalSize(null);
      setShowHintCards(true);
      setShowHotspots(true);
      setActiveHotspotId(null);
      setActiveLayer("all");

      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
        setImageLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [imageSrc]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveHotspotId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function focusHotspot(hotspotId: string, source: "marker" | "note") {
    setActiveHotspotId((current) => (current === hotspotId ? null : hotspotId));
    setShowHintCards(true);
    window.setTimeout(() => {
      if (source === "marker") {
        noteRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        markerRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 0);
  }

  return (
    <article className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-[0_30px_90px_-66px_rgba(15,23,42,0.42)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfaf7] px-4 py-3 text-slate-950">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Visuelle Analyse</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold">{title}</h3>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
              {planLabel(resolvedPlan, target)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
              {intelligenceNotes.length} Befunde
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {displayHotspots.length > 0 ? (
            <button type="button" onClick={() => setShowHotspots((current) => !current)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400">
              {showHotspots ? "Marker aus" : "Marker ein"}
            </button>
          ) : null}
          {allNotes.length > 0 ? (
            <button type="button" onClick={() => setShowHintCards((current) => !current)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400">
              {showHintCards ? "Legende aus" : "Legende ein"}
            </button>
          ) : null}
          {!imageFailed && resolvedPlan !== "free" ? (
            <button type="button" onClick={() => setIsLightboxOpen(true)} className="rounded-full border border-slate-950 bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
              Vollansicht
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {(["all", ...VISUAL_LAYERS] as VisualLayerFilter[]).map((layer) => (
          <button
            key={layer}
            type="button"
            onClick={() => {
              setActiveLayer(layer);
              setActiveHotspotId(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
              activeLayer === layer
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300"
            } ${resolvedPlan === "free" && layer !== "all" && !filteredNotes.some((note) => getNoteMeta(note).layer === layer) ? "opacity-60" : ""}`}
          >
            {layer === "all" ? "Alle Layer" : layer}
          </button>
        ))}
      </div>

      <div className="grid gap-0">
        <div className="relative border-b border-slate-200 bg-slate-100">
          <div className="max-h-[clamp(36rem,78vh,64rem)] overflow-auto">
            {!imageFailed ? (
              <div className="relative min-h-[18rem] w-full">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt={imageAlt}
                  loading="lazy"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
                    setImageLoaded(true);
                  }}
                  onError={() => {
                    setImageFailed(true);
                    setImageLoaded(false);
                  }}
                  className="block h-auto w-full bg-white object-contain object-top"
                />

                {showHotspots && imageLoaded && activeBox ? (
                  <div className="pointer-events-none absolute inset-0 z-20 bg-slate-950/28 transition-opacity" />
                ) : null}

                {showHotspots && imageLoaded && displayHotspots.length > 0 ? (
                  <div className="pointer-events-none absolute inset-0 z-30">
                    {visibleHotspots.map((hotspot, index) => {
                      const note = noteByHotspotId.get(hotspot.id);
                      const meta = note ? getNoteMeta(note) : {
                        layer: normalizeVisualLayer(hotspot.title, hotspot.description),
                        severity: normalizeVisualSeverity(hotspot.tone),
                      };
                      const box = getBoundedHotspotBox(hotspot, baseWidth, baseHeight);
                      const isActive = activeHotspotId === hotspot.id;
                      const severity = severityClasses[meta.severity];

                      return (
                        <button
                          key={hotspot.id}
                          ref={(element) => {
                            markerRefs.current[hotspot.id] = element;
                          }}
                          type="button"
                          onClick={() => focusHotspot(hotspot.id, "marker")}
                          className={`group pointer-events-auto absolute rounded-xl border-2 text-left outline-none transition duration-200 ${
                            isActive ? `z-40 ${severity.marker} ${severity.glow}` : `z-30 ${severity.marker} hover:scale-[1.01]`
                          }`}
                          style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
                          aria-label={`Marker ${index + 1}: ${hotspot.title}`}
                        >
                          <span className={`absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white text-xs font-bold text-white shadow-lg ${severity.dot} ${isActive || meta.severity === "critical" ? "animate-pulse" : ""}`}>
                            {index + 1}
                          </span>
                          <span className="absolute bottom-2 left-2 hidden max-w-[calc(100%-1rem)] rounded-full border border-white/20 bg-slate-950/88 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-xl backdrop-blur-sm sm:inline-flex">
                            {meta.layer}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center bg-slate-100">
                <div className="w-2/3 max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Screenshot nicht geladen</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Die Analyse ist vorhanden, aber die visuelle Vorschau konnte nicht angezeigt werden.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showHintCards && allNotes.length > 0 ? (
          <aside className="bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Marker-Legende</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                {activeHotspotId ? "Fokus" : "Übersicht"}
              </span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {filteredNotes.map((note, index) => {
                const hotspotId = note.hotspotId ?? note.id;
                const meta = getNoteMeta(note);
                const isActive = Boolean(hotspotId && activeHotspotId === hotspotId);
                const severity = severityClasses[meta.severity];

                return (
                  <article
                    key={`${note.title}-${index}`}
                    ref={(element) => {
                      if (hotspotId) noteRefs.current[hotspotId] = element;
                    }}
                    onClick={() => {
                      if (hotspotId && !note.locked) focusHotspot(hotspotId, "note");
                    }}
                    className={`rounded-[0.85rem] border p-3 transition ${
                      note.locked
                        ? "border-dashed border-slate-300 bg-slate-50"
                        : isActive
                          ? "border-cyan-300 bg-cyan-50 shadow-[0_20px_70px_-48px_rgba(8,145,178,0.8)]"
                          : `${severity.surface} hover:border-cyan-300`
                    } ${hotspotId && !note.locked ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${layerAccentClasses[meta.layer]}`}>
                          {index + 1}. {meta.layer}
                        </p>
                        <h3 className="mt-2 text-sm font-bold text-slate-950">{note.title}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${severity.badge}`}>
                        {severityLabel[meta.severity]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{note.text}</p>
                    {!note.locked ? (
                      <details className="mt-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs leading-5 text-slate-700">
                        <summary className="cursor-pointer font-bold text-slate-950">Details</summary>
                        <div className="mt-2 grid gap-2">
                          {note.problem ? <p><strong>Diagnose:</strong> {note.problem}</p> : null}
                          {(note.businessImpact ?? note.impact) ? <p><strong>Business-Relevanz:</strong> {note.businessImpact ?? note.impact}</p> : null}
                          {(note.action ?? note.recommendation) ? <p><strong>Handlung:</strong> {note.action ?? note.recommendation}</p> : null}
                        </div>
                      </details>
                    ) : (
                      <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        {note.unlockLabel ?? "Unlock deeper intelligence"}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </aside>
        ) : null}
      </div>

      <ScreenshotLightbox
        images={[{ src: imageSrc, alt: imageAlt, title, notes: intelligenceNotes, visualMap, hotspots: displayHotspots, target }]}
        currentIndex={0}
        isOpen={isLightboxOpen && !imageFailed}
        onClose={() => setIsLightboxOpen(false)}
        onSelect={() => undefined}
      />
    </article>
  );
}
