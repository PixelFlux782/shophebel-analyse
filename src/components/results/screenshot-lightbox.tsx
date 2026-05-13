"use client";

import { useEffect } from "react";

export type ScreenshotLightboxImage = {
  src: string;
  alt: string;
  title: string;
  notes?: ScreenshotLightboxNote[];
};

export type ScreenshotLightboxNote = {
  title: string;
  text: string;
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

  if (!isOpen || !currentImage) {
    return null;
  }

  const previousIndex = (currentIndex - 1 + images.length) % images.length;
  const nextIndex = (currentIndex + 1) % images.length;

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Vollansicht schliessen"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/8 text-lg font-semibold text-white shadow-lg transition hover:border-cyan-300/50 hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
          >
            <span aria-hidden="true">X</span>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 bg-slate-950/65 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="relative flex min-h-0 items-center justify-center p-3 sm:p-5">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-h-full max-w-full rounded-xl border border-white/10 bg-white object-contain shadow-[0_26px_90px_-50px_rgba(0,0,0,0.9)]"
            />

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
                  aria-label="Naechsten Screenshot anzeigen"
                  className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/72 text-2xl font-semibold text-white shadow-xl backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:right-5"
                >
                  <span aria-hidden="true">&gt;</span>
                </button>
              </>
            ) : null}
          </div>

          <aside className="min-h-0 overflow-y-auto border-t border-white/10 bg-white/6 p-4 backdrop-blur-xl lg:border-l lg:border-t-0 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              Hinweise
            </p>
            <div className="mt-4 grid gap-3">
              {notes.length > 0 ? (
                notes.map((note, index) => (
                  <article
                    key={`${note.title}-${index}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                  >
                    <h3 className="text-sm font-bold text-white">{note.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{note.text}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-400">
                  Keine Hinweise fuer diese Ansicht vorhanden.
                </div>
              )}
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
