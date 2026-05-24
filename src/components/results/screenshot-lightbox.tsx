"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { VisualHotspot, VisualHotspotTarget } from "@/lib/result-ui";
import { VisualMap } from "@/types/analysis";

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
};

interface ScreenshotLightboxProps {
  images: ScreenshotLightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
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
  const notes = currentImage?.notes ?? [];
  const hasNotes = notes.length > 0;
  const [showNotes, setShowNotes] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"alle" | "kritisch" | "wichtig" | "chance">("alle");
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const visualMap = currentImage?.visualMap;
  const hotspots = currentImage?.hotspots ?? [];
  const target = currentImage?.target ?? "viewport";
  const mappedWidth = visualMap ? (target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth) : 0;
  const mappedHeight = visualMap ? (target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight) : 0;
  const hasMarkers = Boolean(visualMap && hotspots.length > 0 && mappedWidth > 0 && mappedHeight > 0);
  const filteredNotes = useMemo(
    () => notes.filter((note) => activeFilter === "alle" || note.priority === activeFilter || note.badge?.toLowerCase() === activeFilter),
    [activeFilter, notes],
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
    if (!isOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowNotes(true);
      setShowMarkers(true);
      setActiveHotspotId(null);
      setActiveFilter("alle");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (!hasNavigation) {
        return;
      }

      if (event.key === "ArrowLeft") {
        onSelect((currentIndex - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        onSelect((currentIndex + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, hasNavigation, images.length, isOpen, onClose, onSelect]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !currentImage) {
    return null;
  }

  const previousIndex = (currentIndex - 1 + images.length) % images.length;
  const nextIndex = (currentIndex + 1) % images.length;
  const focusHotspot = (hotspotId: string) => {
    setActiveHotspotId(hotspotId);
    setShowNotes(true);
    window.setTimeout(() => {
      noteRefs.current[hotspotId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${currentImage.title} in Vollansicht`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 px-3 py-4 backdrop-blur-xl sm:px-6 sm:py-8"
      onMouseDown={onClose}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border border-white/12 bg-slate-950/85 shadow-[0_36px_120px_-45px_rgba(0,0,0,0.85)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Vollansicht
            </p>
            <p className="mt-1 truncate text-sm text-slate-300">{currentImage.title}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {hasMarkers ? (
              <button
                type="button"
                onClick={() => setShowMarkers((current) => !current)}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:border-cyan-300/50 hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              >
                {showMarkers ? "Markierungen aus" : "Markierungen ein"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowNotes((current) => !current)}
              disabled={!hasNotes}
              className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:border-cyan-300/50 hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {hasNotes ? (showNotes ? "Hinweise ausblenden" : "Hinweise anzeigen") : "Keine Hinweise verfügbar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Vollansicht schließen"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/8 text-lg font-semibold text-white shadow-lg transition hover:border-cyan-300/50 hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
        </div>

        <div
          className={`grid min-h-0 flex-1 gap-0 bg-slate-950/65 transition-[grid-template-columns] duration-300 ease-out ${
            showNotes || !hasNotes ? "lg:grid-cols-[minmax(0,1fr)_25rem]" : "lg:grid-cols-[minmax(0,1fr)_0rem]"
          }`}
        >
          <div className="relative flex min-h-0 items-center justify-center overflow-auto p-3 sm:p-5">
            <div className="relative max-h-full max-w-full">
              <img
                src={currentImage.src}
                alt={currentImage.alt}
                className="max-h-[calc(100vh-9rem)] max-w-full rounded-xl border border-white/10 bg-white object-contain shadow-[0_26px_90px_-50px_rgba(0,0,0,0.9)]"
              />
              {hasMarkers && showMarkers ? (
                <div className="pointer-events-none absolute inset-0 z-20">
                  {visibleHotspots.map((hotspot, index) => {
                    const left = Math.max(1.5, Math.min(94, (hotspot.x / mappedWidth) * 100));
                    const top = Math.max(1.5, Math.min(94, (hotspot.y / mappedHeight) * 100));
                    const width = Math.max(4, Math.min(98 - left, (hotspot.width / mappedWidth) * 100));
                    const height = Math.max(4, Math.min(98 - top, (hotspot.height / mappedHeight) * 100));
                    const labelLeft = left > 72 ? "auto" : left < 12 ? "0" : "0";
                    const labelRight = left > 72 ? "0" : "auto";
                    const labelTop = top > 78 ? "auto" : "100%";
                    const labelBottom = top > 78 ? "100%" : "auto";
                    const isActive = activeHotspotId === hotspot.id;

                    return (
                      <button
                        key={hotspot.id}
                        type="button"
                        onClick={() => focusHotspot(hotspot.id)}
                        className={`pointer-events-auto absolute rounded-xl border-2 text-left transition ${
                          isActive
                            ? "z-40 border-cyan-300 bg-cyan-300/20 shadow-[0_0_0_3px_rgba(103,232,249,0.24)]"
                            : hotspot.tone === "problem"
                              ? "z-20 border-rose-400 bg-rose-400/16"
                              : hotspot.tone === "good"
                                ? "z-20 border-emerald-400 bg-emerald-400/16"
                                : "z-20 border-amber-300 bg-amber-300/16"
                        }`}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                        aria-label={`Marker ${index + 1}: ${hotspot.title}`}
                      >
                        <span className="absolute left-2 top-2 z-30 grid h-7 w-7 place-items-center rounded-full border border-white bg-slate-950 text-xs font-bold text-white shadow-lg">
                          {index + 1}
                        </span>
                        <span
                          className="absolute z-30 mt-2 max-w-[13rem] rounded-xl border border-white/20 bg-slate-950/92 px-3 py-2 text-xs font-bold leading-5 text-white shadow-xl"
                          style={{ left: labelLeft, right: labelRight, top: labelTop, bottom: labelBottom }}
                        >
                          {hotspot.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {hasNavigation ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelect(previousIndex)}
                  aria-label="Vorherigen Screenshot anzeigen"
                  className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/72 text-2xl font-semibold text-white shadow-xl backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:left-5"
                >
                  <span aria-hidden="true">&lt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(nextIndex)}
                  aria-label="Nächsten Screenshot anzeigen"
                  className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/72 text-2xl font-semibold text-white shadow-xl backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:right-5"
                >
                  <span aria-hidden="true">&gt;</span>
                </button>
              </>
            ) : null}
          </div>

          <aside
            aria-hidden={!showNotes}
            className={`min-h-0 overflow-hidden border-t border-white/10 bg-white/6 backdrop-blur-xl transition-all duration-300 ease-out lg:border-l lg:border-t-0 ${
              showNotes || !hasNotes
                ? "max-h-[38vh] opacity-100 lg:max-h-none"
                : "max-h-0 border-t-0 opacity-0 lg:border-l-0"
            }`}
          >
            <div className="h-full overflow-y-auto p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Visual Audit
                </p>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                  {notes.length || 0} Hinweise
                </span>
              </div>
              {hasNotes ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["alle", "kritisch", "wichtig", "chance"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                        activeFilter === filter
                          ? "border-cyan-300 bg-cyan-300 text-slate-950"
                          : "border-white/10 bg-white/8 text-slate-200 hover:border-cyan-300/50"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 grid gap-3">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note, index) => {
                    const hotspotId = note.hotspotId ?? note.id;

                    return (
                    <article
                      key={`${note.title}-${index}`}
                      ref={(element) => {
                        if (hotspotId) noteRefs.current[hotspotId] = element;
                      }}
                      onClick={() => hotspotId ? setActiveHotspotId(hotspotId) : undefined}
                      className={`rounded-2xl border p-4 shadow-[0_18px_60px_-44px_rgba(34,211,238,0.75)] transition ${
                        hotspotId && activeHotspotId === hotspotId
                          ? "border-cyan-300 bg-cyan-300/12"
                          : "border-white/10 bg-slate-950/55"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/80">
                            {note.category ?? "Visual Audit"}
                          </p>
                          <h3 className="mt-2 text-sm font-bold text-white">{note.title}</h3>
                        </div>
                        {note.badge ? (
                          <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200">
                            {note.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{note.text}</p>
                      {note.problem || note.impact || note.recommendation ? (
                        <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-300">
                          {note.problem ? <p><strong className="text-white">Problem:</strong> {note.problem}</p> : null}
                          {note.impact ? <p><strong className="text-white">Warum relevant:</strong> {note.impact}</p> : null}
                          {note.recommendation ? <p><strong className="text-white">Aenderung:</strong> {note.recommendation}</p> : null}
                        </div>
                      ) : null}
                    </article>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-400">
                    Für diese Ansicht sind aktuell keine zusätzlichen Hinweise vorhanden.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {hasNavigation ? (
          <div className="border-t border-white/10 bg-white/6 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 backdrop-blur-xl">
            {currentIndex + 1} / {images.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}
