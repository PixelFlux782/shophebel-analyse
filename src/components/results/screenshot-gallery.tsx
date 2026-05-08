import Image from "next/image";

import { AnalysisScreenshots } from "@/types/analysis";

interface ScreenshotGalleryProps {
  screenshots: AnalysisScreenshots;
  excludeVariant?: keyof AnalysisScreenshots;
}

function ScreenshotImage({
  src,
  alt,
  title,
}: {
  src: string;
  alt: string;
  title: string;
}) {
  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.28)]">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          sizes="(max-width: 1024px) 100vw, 960px"
          className="h-auto w-full object-top"
          unoptimized
        />
      </div>
    </article>
  );
}

export function ScreenshotGallery({
  screenshots,
  excludeVariant,
}: ScreenshotGalleryProps) {
  return (
    <div className="mt-6 grid gap-5">
      {screenshots.viewport && excludeVariant !== "viewport" ? (
        <ScreenshotImage
          src={screenshots.viewport}
          alt="Desktop-Vorschau der analysierten Seite"
          title="Desktop-Vorschau"
        />
      ) : null}
      {screenshots.fullPage && excludeVariant !== "fullPage" ? (
        <ScreenshotImage
          src={screenshots.fullPage}
          alt="Gesamtscreenshot der analysierten Seite"
          title="Gesamtansicht"
        />
      ) : null}
      {!screenshots.viewport && screenshots.hero && excludeVariant !== "hero" ? (
        <ScreenshotImage
          src={screenshots.hero}
          alt="Hero-Vorschau der analysierten Seite"
          title="Hero-Vorschau"
        />
      ) : null}
      {screenshots.mobile && excludeVariant !== "mobile" ? (
        <ScreenshotImage
          src={screenshots.mobile}
          alt="Mobile Vorschau der analysierten Seite"
          title="Mobile Vorschau"
        />
      ) : null}
    </div>
  );
}
