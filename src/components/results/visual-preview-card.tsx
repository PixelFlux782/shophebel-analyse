import { AnalysisResult } from "@/types/analysis";
import { getVisualHotspots, VisualHotspotTarget } from "@/lib/result-ui";

import { ScreenshotFallback } from "@/components/results/screenshot-fallback";
import { ScreenshotGallery } from "@/components/results/screenshot-gallery";
import { VisualOverlay } from "@/components/results/visual-overlay";

interface VisualPreviewCardProps {
  result: AnalysisResult;
}

export function VisualPreviewCard({ result }: VisualPreviewCardProps) {
  const screenshots = result.screenshots;
  const hasPreview = Boolean(
    screenshots?.viewport || screenshots?.fullPage || screenshots?.hero,
  );
  const primaryVariant: keyof NonNullable<typeof screenshots> | null = screenshots?.viewport
    ? "viewport"
    : screenshots?.fullPage
      ? "fullPage"
      : screenshots?.hero
        ? "hero"
        : null;
  const primaryImage = primaryVariant ? screenshots?.[primaryVariant] : undefined;
  const overlayTarget: VisualHotspotTarget =
    primaryVariant === "viewport" ? "viewport" : "fullPage";
  const hotspots = getVisualHotspots(result, overlayTarget);
  const hasAdditionalImages = Boolean(
    screenshots &&
      ((screenshots.viewport && primaryVariant !== "viewport") ||
        (screenshots.fullPage && primaryVariant !== "fullPage") ||
        (screenshots.hero && primaryVariant !== "hero") ||
        screenshots.mobile),
  );

  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Visuelle Vorschau
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Sichtbare Seitenansicht
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
        {result.analysisMode === "rendered"
          ? "Diese Vorschau zeigt, wie die Seite im Browser wirkt. So lassen sich Layout, Buttons und sichtbare Elemente besser einordnen."
          : "Wenn eine echte Browseransicht verfuegbar ist, erscheint hier eine visuelle Vorschau der Seite."}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
        Die markierten Bereiche helfen dir, Probleme, Chancen und starke Signale direkt in deinem sichtbaren Layout nachzuvollziehen.
      </p>

      {hasPreview && screenshots && primaryImage && result.visualMap ? (
        <div className="mt-6 space-y-5">
          <VisualOverlay
            imageSrc={primaryImage}
            imageAlt="Visuelle Vorschau der analysierten Seite mit Markierungen"
            title={
              primaryVariant === "viewport"
                ? "Sichtbarer Bereich mit Markierungen"
                : primaryVariant === "hero"
                  ? "Oberer Seitenbereich mit Markierungen"
                  : "Gesamtansicht mit Markierungen"
            }
            visualMap={result.visualMap}
            hotspots={hotspots}
            target={overlayTarget}
            suggestions={result.aiSuggestions}
          />
          {hasAdditionalImages ? (
            <ScreenshotGallery
              screenshots={screenshots}
              excludeVariant={primaryVariant ?? undefined}
            />
          ) : screenshots.mobile ? (
            <ScreenshotGallery
              screenshots={{ mobile: screenshots.mobile }}
            />
          ) : null}
        </div>
      ) : hasPreview && screenshots ? (
        <ScreenshotGallery screenshots={screenshots} />
      ) : (
        <div className="mt-6">
          <ScreenshotFallback />
        </div>
      )}
    </section>
  );
}
