"use client";

import { useEffect, useState } from "react";

import { AnalysisScreenshots } from "@/types/analysis";
import { ScreenshotFallback } from "@/components/results/screenshot-fallback";
import {
  ScreenshotLightbox,
  ScreenshotLightboxImage,
  ScreenshotLightboxNote,
} from "@/components/results/screenshot-lightbox";

interface ScreenshotGalleryProps {
  screenshots: AnalysisScreenshots;
  excludeVariant?: keyof AnalysisScreenshots;
  notesByVariant?: Partial<Record<keyof AnalysisScreenshots, ScreenshotLightboxNote[]>>;
}

function ScreenshotImage({
  src,
  alt,
  title,
  notes,
  onOpen,
}: {
  src: string;
  alt: string;
  title: string;
  notes?: ScreenshotLightboxNote[];
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const hasHints = Boolean(notes?.length);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFailed(false);
      setShowHints(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [src]);

  const handleImageError = () => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[screenshot-gallery] Screenshot image failed to load", {
        src,
      });
    }

    setFailed(true);
  };

  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>
        {hasHints ? (
          <button
            type="button"
            onClick={() => setShowHints((current) => !current)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
          >
            {showHints ? "Hinweise ausblenden" : "Hinweise anzeigen"}
          </button>
        ) : null}
      </div>

      <div className={`mt-4 grid gap-4 ${showHints && hasHints ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
        <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.28)]">
          {failed ? (
            <ScreenshotFallback />
          ) : (
            <div className="relative">
              <img
                src={src}
                alt={alt}
                loading="lazy"
                onError={handleImageError}
                className="h-auto w-full object-top"
              />
              <button
                type="button"
                onClick={onOpen}
                className="absolute right-3 top-3 z-10 rounded-full border border-white/50 bg-slate-950/78 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.85)] backdrop-blur-md transition hover:border-cyan-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              >
                Vollansicht
              </button>
            </div>
          )}
        </div>

        {showHints && hasHints ? (
          <div className="max-h-[30rem] overflow-y-auto rounded-[1.2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              Hinweise
            </p>
            <div className="mt-3 grid gap-3">
              {notes?.map((note, index) => (
                <article key={`${note.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ScreenshotGallery({
  screenshots,
  excludeVariant,
  notesByVariant,
}: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryImages: ScreenshotLightboxImage[] = [];

  if (screenshots.viewport && excludeVariant !== "viewport") {
    galleryImages.push({
      src: screenshots.viewport,
      alt: "Desktop-Vorschau der analysierten Seite",
      title: "Desktop-Vorschau",
      notes: notesByVariant?.viewport,
    });
  }

  if (screenshots.fullPage && excludeVariant !== "fullPage") {
    galleryImages.push({
      src: screenshots.fullPage,
      alt: "Gesamtscreenshot der analysierten Seite",
      title: "Gesamtansicht",
      notes: notesByVariant?.fullPage,
    });
  }

  if (!screenshots.viewport && screenshots.hero && excludeVariant !== "hero") {
    galleryImages.push({
      src: screenshots.hero,
      alt: "Hero-Vorschau der analysierten Seite",
      title: "Hero-Vorschau",
      notes: notesByVariant?.hero,
    });
  }

  if (screenshots.mobile && excludeVariant !== "mobile") {
    galleryImages.push({
      src: screenshots.mobile,
      alt: "Mobile Vorschau der analysierten Seite",
      title: "Mobile Vorschau",
      notes: notesByVariant?.mobile,
    });
  }

  return (
    <>
      <div className="mt-6 grid gap-5">
        {galleryImages.map((image, index) => (
          <ScreenshotImage
            key={`${image.title}-${image.src}`}
            src={image.src}
            alt={image.alt}
            title={image.title}
            notes={image.notes}
            onOpen={() => setLightboxIndex(index)}
          />
        ))}
      </div>
      <ScreenshotLightbox
        images={galleryImages}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onSelect={setLightboxIndex}
      />
    </>
  );
}
