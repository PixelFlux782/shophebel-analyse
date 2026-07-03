"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { VisualHotspot, VisualHotspotTarget } from "@/lib/result-ui";
import { VisualMap } from "@/types/analysis";
import {
  isLayerVisible,
  normalizeVisualLayer,
  normalizeVisualSeverity,
  severityClasses,
  severityLabel,
  VISUAL_LAYERS,
  VisualLayer,
  VisualLayerFilter,
  VisualSeverity,
} from "@/components/results/visual-intelligence-model";

export type ScreenshotLightboxImage = {
  src: string;
  alt: string;
  title: string;
  notes?: ScreenshotLightboxNote[];
  visualMap?: VisualMap;
  hotspots?: VisualHotspot[];
  target?: VisualHotspotTarget;
};

export type ScreenshotLightboxNote = {
  title: string;
  text: string;
  category?: string;
  badge?: string;
  id?: string;
  hotspotId?: string;
  priority?: "kritisch" | "wichtig" | "chance";
  problem?: string;
  impact?: string;
  recommendation?: string;
  action?: string;
  businessImpact?: string;
  layer?: VisualLayer | "Strategy";
  severity?: VisualSeverity;
  locked?: boolean;
  unlockLabel?: string;
};

interface ScreenshotLightboxProps {
  images: ScreenshotLightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

function getBoundedHotspotBox(hotspot: VisualHotspot, mappedWidth: number, mappedHeight: number) {
  const rawLeft = (hotspot.x / mappedWidth) * 100;
  const rawTop = (hotspot.y / mappedHeight) * 100;
  const rawWidth = (hotspot.width / mappedWidth) * 100;
  const rawHeight = (hotspot.height / mappedHeight) * 100;
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

export function ScreenshotLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onSelect,
}: ScreenshotLightboxProps) {
  const currentImage = images[currentIndex];
  const hasNavigation = images.length > 1;
  const notes = useMemo(() => currentImage?.notes ?? [], [currentImage?.notes]);
  const [showNotes, setShowNotes] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<VisualLayerFilter>("all");
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const visualMap = currentImage?.visualMap;
  const hotspots = useMemo(() => currentImage?.hotspots ?? [], [currentImage?.hotspots]);
  const target = currentImage?.target ?? "viewport";
  const mappedWidth = visualMap ? (target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth) : 0;
  const mappedHeight = visualMap ? (target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight) : 0;
  const hasMarkers = Boolean(visualMap && hotspots.length > 0 && mappedWidth > 0 && mappedHeight > 0);

  const noteByHotspotId = useMemo(() => {
    const map = new Map<string, ScreenshotLightboxNote>();
    notes.forEach((note) => {
      const id = note.hotspotId ?? note.id;
      if (id) map.set(id, note);
    });
    return map;
  }, [notes]);

  const filteredNotes = useMemo(
    () => notes.filter((note) => isLayerVisible(getNoteMeta(note).layer, activeLayer)),
    [activeLayer, notes],
  );

  const visibleHotspots = useMemo(() => {
    if (!hasMarkers) return [];
    if (activeLayer === "all") return hotspots;

    return hotspots.filter((hotspot) => {
      const note = noteByHotspotId.get(hotspot.id);
      const layer = note ? getNoteMeta(note).layer : normalizeVisualLayer(hotspot.title, hotspot.description);
      return isLayerVisible(layer, activeLayer);
    });
  }, [activeLayer, hasMarkers, hotspots, noteByHotspotId]);

  const activeHotspot = visibleHotspots.find((hotspot) => hotspot.id === activeHotspotId);
  const activeBox =
    activeHotspot && mappedWidth > 0 && mappedHeight > 0
      ? getBoundedHotspotBox(activeHotspot, mappedWidth, mappedHeight)
      : null;

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      setShowNotes(true);
      setShowMarkers(true);
      setActiveHotspotId(null);
      setActiveLayer("all");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (activeHotspotId) {
          setActiveHotspotId(null);
          return;
        }
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (visibleHotspots.length > 0) {
          event.preventDefault();
          const current = Math.max(0, visibleHotspots.findIndex((hotspot) => hotspot.id === activeHotspotId));
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const next = (current + direction + visibleHotspots.length) % visibleHotspots.length;
          focusHotspot(visibleHotspots[next].id, "marker");
          return;
        }

        if (hasNavigation) {
          onSelect(event.key === "ArrowRight" ? (currentIndex + 1) % images.length : (currentIndex - 1 + images.length) % images.length);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHotspotId, currentIndex, hasNavigation, images.length, isOpen, onClose, onSelect, visibleHotspots]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !currentImage) {
    return null;
  }

  function focusHotspot(hotspotId: string, source: "marker" | "note") {
    setActiveHotspotId((current) => (current === hotspotId ? null : hotspotId));
    setShowNotes(true);
    window.setTimeout(() => {
      if (source === "marker") {
        noteRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        markerRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 0);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${currentImage.title} Detailansicht`}
      className="fixed inset-0 z-50 bg-slate-950 text-white"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="z-50 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/96 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Visuelle Analyse</p>
            <p className="mt-1 truncate text-sm text-slate-300">{currentImage.title}</p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-slate-200">
              {filteredNotes.length} Issues
            </span>
            {hasMarkers ? (
              <button type="button" onClick={() => setShowMarkers((value) => !value)} className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-cyan-300/60">
                {showMarkers ? "Marker aus" : "Marker ein"}
              </button>
            ) : null}
            <button type="button" onClick={() => setShowNotes((value) => !value)} disabled={notes.length === 0} className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50">
              {showNotes ? "Hinweise aus" : "Hinweise ein"}
            </button>
            <button type="button" onClick={onClose} aria-label="Fullscreen schliessen" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/8 text-sm font-bold transition hover:border-cyan-300/60">
              X
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-3 sm:px-5">
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
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-white/10 bg-white/6 text-slate-300 hover:border-cyan-300/50"
              }`}
            >
              {layer === "all" ? "Alle Layer" : layer}
            </button>
          ))}
        </div>

        <div className={`grid min-h-0 flex-1 bg-slate-950 ${showNotes && notes.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_25rem]" : "lg:grid-cols-1"}`}>
          <main className="min-h-0 overflow-auto p-3 sm:p-5">
            <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[1.35rem] border border-white/10 bg-white shadow-[0_36px_120px_-70px_rgba(0,0,0,0.95)]">
              <img src={currentImage.src} alt={currentImage.alt} className="block h-auto w-full object-contain object-top" />

              {showMarkers && hasMarkers && activeBox ? (
                <div className="pointer-events-none absolute inset-0 z-20 bg-slate-950/38 transition-opacity" />
              ) : null}

              {showMarkers && hasMarkers ? (
                <div className="pointer-events-none absolute inset-0 z-30">
                  {visibleHotspots.map((hotspot, index) => {
                    const box = getBoundedHotspotBox(hotspot, mappedWidth, mappedHeight);
                    const note = noteByHotspotId.get(hotspot.id);
                    const meta = note ? getNoteMeta(note) : {
                      layer: normalizeVisualLayer(hotspot.title, hotspot.description),
                      severity: normalizeVisualSeverity(hotspot.tone),
                    };
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
          </main>

          {showNotes && notes.length > 0 ? (
            <aside className="min-h-0 overflow-y-auto border-t border-white/10 bg-white/7 p-4 backdrop-blur-xl lg:border-l lg:border-t-0 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Insight Cards</p>
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                  {activeHotspotId ? "Focus" : "Live"}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {filteredNotes.map((note, index) => {
                  const hotspotId = note.hotspotId ?? note.id;
                  const meta = getNoteMeta(note);
                  const isActive = Boolean(hotspotId && activeHotspotId === hotspotId);

                  return (
                    <article
                      key={`${note.title}-${index}`}
                      ref={(element) => {
                        if (hotspotId) noteRefs.current[hotspotId] = element;
                      }}
                      onClick={() => {
                        if (hotspotId) focusHotspot(hotspotId, "note");
                      }}
                      className={`cursor-pointer rounded-[1.1rem] border p-4 transition ${
                        isActive
                          ? "border-cyan-300 bg-cyan-300/12 shadow-[0_20px_70px_-42px_rgba(34,211,238,0.8)]"
                          : "border-white/10 bg-slate-950/55 hover:border-cyan-300/35"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/80">{meta.layer}</p>
                          <h3 className="mt-2 text-sm font-bold text-white">{note.title}</h3>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${severityClasses[meta.severity].badge}`}>
                          {severityLabel[meta.severity]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{note.text}</p>
                      <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-300">
                        {(note.businessImpact ?? note.impact) ? <p><strong className="text-white">Business:</strong> {note.businessImpact ?? note.impact}</p> : null}
                        {(note.action ?? note.recommendation) ? <p><strong className="text-white">Naechster Schritt:</strong> {note.action ?? note.recommendation}</p> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
