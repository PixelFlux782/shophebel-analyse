"use client";

import { useEffect, useState } from "react";

import { AnalysisScreenshots } from "@/types/analysis";
import { ScreenshotFallback } from "@/components/results/screenshot-fallback";
import {
  ScreenshotLightbox,
  ScreenshotLightboxImage,
} from "@/components/results/screenshot-lightbox";

interface ScreenshotGalleryProps {
  screenshots: AnalysisScreenshots;
  excludeVariant?: keyof AnalysisScreenshots;
}

function ScreenshotImage({
  src,
  alt,
  title,
  onOpen,
}: {
  src: string;
  alt: string;
  title: string;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.28)]">
        {failed ? (
          <ScreenshotFallback />
        ) : (
          <div className="relative">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-auto w-full object-top"
            />
            <button
              type="button"
              onClick={onOpen}
              className="absolute right-3 top-3 rounded-full border border-white/50 bg-slate-950/78 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.85)] backdrop-blur-md transition hover:border-cyan-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            >
              Vollansicht
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ScreenshotGallery({
  screenshots,
  excludeVariant,
}: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryImages: ScreenshotLightboxImage[] = [];

  if (screenshots.viewport && excludeVariant !== "viewport") {
    galleryImages.push({
      src: screenshots.viewport,
      alt: "Desktop-Vorschau der analysierten Seite",
      title: "Desktop-Vorschau",
    });
  }

  if (screenshots.fullPage && excludeVariant !== "fullPage") {
    galleryImages.push({
      src: screenshots.fullPage,
      alt: "Gesamtscreenshot der analysierten Seite",
      title: "Gesamtansicht",
    });
  }

  if (!screenshots.viewport && screenshots.hero && excludeVariant !== "hero") {
    galleryImages.push({
      src: screenshots.hero,
      alt: "Hero-Vorschau der analysierten Seite",
      title: "Hero-Vorschau",
    });
  }

  if (screenshots.mobile && excludeVariant !== "mobile") {
    galleryImages.push({
      src: screenshots.mobile,
      alt: "Mobile Vorschau der analysierten Seite",
      title: "Mobile Vorschau",
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
