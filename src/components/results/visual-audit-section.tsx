"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AnalysisResult, AuditCheckStatus, ScoreBlock } from "@/types/analysis";
import { getVisualHotspots } from "@/lib/result-ui";
import { ScreenshotFallback } from "@/components/results/screenshot-fallback";
import {
  ScreenshotLightbox,
  ScreenshotLightboxNote,
} from "@/components/results/screenshot-lightbox";
import { VisualOverlay } from "@/components/results/visual-overlay";
import { normalizeGermanReportText } from "@/lib/report/reportCopy";
import {
  normalizeVisualLayer,
  normalizeVisualSeverity,
  priorityFromSeverity,
  VisualPlan,
} from "@/components/results/visual-intelligence-model";

type VisualProblemTone = "Kritisch" | "Wichtig" | "Chance";

type VisualProblem = {
  category: string;
  tone: VisualProblemTone;
  title: string;
  text: string;
};

type ScreenshotDiagnostic = {
  title: string;
  description: string;
  reason: string;
  details: string[];
  cta: string;
};

const toneClasses: Record<VisualProblemTone, string> = {
  Kritisch: "border-rose-200 bg-rose-50 text-rose-900",
  Wichtig: "border-amber-200 bg-amber-50 text-amber-900",
  Chance: "border-cyan-200 bg-cyan-50 text-cyan-900",
};

const toneBadgeClasses: Record<VisualProblemTone, string> = {
  Kritisch: "bg-rose-600 text-white",
  Wichtig: "bg-amber-500 text-white",
  Chance: "bg-cyan-600 text-white",
};

const friendlyTitleMap: Record<string, string> = {
  "Title/Description": "Erster Eindruck in Such- und Linkvorschauen",
  "Suchergebnis-Klarheit": "Erster Eindruck in Such- und Linkvorschauen",
  "H1/H2-Struktur": "Klarheit der Überschriften",
  "Klarheit der Seitenbotschaft": "Klarheit der Seitenbotschaft",
  "Alt-Texte": "Bildverständnis",
  "Indexierung/Struktur": "Auffindbarkeit",
  "Auffindbarkeit der Hauptseite": "Auffindbarkeit",
  "Mobile Viewport": "Mobile Darstellung",
  "Mobile Darstellung": "Mobile Darstellung",
  HTTPS: "Sicheres Laden",
  "Sicheres Laden": "Sicheres Laden",
  Ladezeit: "Ladegefühl",
  Ladegefuehl: "Ladegefühl",
  "Core Web Vitals": "Gefühlte Performance",
  "Stabilitaet beim Laden": "Stabilität beim Laden",
  Impressum: "Rechtliches Vertrauen",
  Datenschutz: "Datenschutz-Vertrauen",
  Kontaktvertrauen: "Kontakt sichtbar",
  "Bewertungen/Siegel/Zahlungsarten": "Kaufvertrauen",
  Vertrauensbelege: "Kaufvertrauen",
  "CTA-Erkennung": "Nächster Schritt",
  "Naechster Schritt": "Nächster Schritt",
  "Formular/Lead-Erfassung": "Anfrageweg",
  "Einfacher Anfrageweg": "Anfrageweg",
  Angebotsklarheit: "Angebot sofort verstehen",
  "Screenshot/Visual-Check": "Visuelle Prüfung",
  "Visuelle Seitenpruefung": "Visuelle Prüfung",
  "Layout-Signale": "Layout-Führung",
  Blickfuehrung: "Blickführung",
  "Lesbarkeit/Content-Dichte": "Lesbarkeit und Dichte",
  "Lesbarkeit und Inhaltstiefe": "Lesbarkeit und Inhaltstiefe",
  "Strukturierte Daten": "KI-Verständlichkeit",
};

function checkTone(status: AuditCheckStatus): VisualProblemTone | null {
  if (status === "critical") return "Kritisch";
  if (status === "warning") return "Wichtig";
  if (status === "unknown" || status === "not_checked") return "Chance";
  return null;
}

function firstProblem(category: string, block: ScoreBlock): VisualProblem | null {
  const check =
    block.checks.find((entry) => entry.status === "critical") ??
    block.checks.find((entry) => entry.status === "warning") ??
    block.checks.find((entry) => entry.status === "unknown" || entry.status === "not_checked");

  if (!check) {
    return {
      category,
      tone: "Chance",
      title: `${category} weiter stärken`,
      text: normalizeGermanReportText(block.summary),
    };
  }

  const tone = checkTone(check.status);
  if (!tone) return null;

  return {
    category,
    tone,
    title: normalizeGermanReportText(friendlyTitleMap[check.title] ?? check.title),
    text: normalizeGermanReportText(check.message),
  };
}

function buildVisualProblems(result: AnalysisResult): VisualProblem[] {
  const blocks: Array<[string, ScoreBlock]> = [
    ["Vertrauen", result.categories.trust],
    ["Klarheit", result.categories.conversion],
    ["Mobile UX", result.categories.performance],
    ["CTA", result.categories.conversion],
    ["Design", result.categories.design],
    ["Ladegefühl", result.categories.performance],
    ["AI-Sichtbarkeit", result.categories.aiVisibility],
  ];
  const seen = new Set<string>();

  return blocks
    .flatMap(([category, block]) => {
      const problem = firstProblem(category, block);
      return problem ? [problem] : [];
    })
    .filter((problem) => {
      const key = `${problem.category}:${problem.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 7);
}

function noteCategory(category: string, title: string) {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes("mobile")) return "Mobile UX";
  if (text.includes("lade")) return "Ladegefuehl";
  if (text.includes("vertrauen")) return "Vertrauen";
  if (text.includes("cta") || text.includes("naechster") || text.includes("nächster")) return "Button-Klarheit";
  if (text.includes("design") || text.includes("blick") || text.includes("layout")) return "Visuelle Hierarchie";
  if (text.includes("klarheit")) return "Sichtbarer Startbereich";
  return category;
}

function noteText(problem: VisualProblem, isPremium: boolean) {
  const maxLength = isPremium ? 260 : 150;
  return problem.text.length > maxLength ? `${problem.text.slice(0, maxLength - 3)}...` : problem.text;
}

function problemImpact(problem: VisualProblem) {
  if (problem.category === "Vertrauen") {
    return "Wenn Sicherheit, Bewertungen oder Kontaktwege zu spät sichtbar werden, zögern Besucher eher vor Anfrage oder Kauf.";
  }

  if (problem.category === "CTA" || problem.category === "Klarheit") {
    return "Wenn der nächste Schritt nicht sofort klar ist, muss der Besucher selbst nachdenken und springt schneller ab.";
  }

  if (problem.category === "Mobile UX") {
    return "Auf dem Smartphone kostet jede Unklarheit mehr Aufmerksamkeit, weil weniger Platz für Orientierung vorhanden ist.";
  }

  return "Der Bereich bremst die Blickführung und macht es schwerer, den Wert der Seite schnell zu erkennen.";
}

function problemRecommendation(problem: VisualProblem) {
  if (problem.category === "Vertrauen") {
    return "Vertrauenselemente wie Bewertungen, Referenzen, Kontaktmöglichkeiten oder Sicherheitshinweise vor der Entscheidung platzieren.";
  }

  if (problem.category === "CTA" || problem.category === "Klarheit") {
    return "Hauptversprechen und primären Button im sichtbaren Startbereich klarer priorisieren und sprachlich eindeutiger machen.";
  }

  if (problem.category === "Mobile UX") {
    return "Mobile Reihenfolge, Schriftgrößen und Button-Abstände prüfen, damit der nächste Schritt ohne Suchen erreichbar bleibt.";
  }

  return "Abschnitte, Abstände und visuelle Gewichtung so ordnen, dass der wichtigste Inhalt zuerst wahrgenommen wird.";
}

function notesFromProblems(
  problems: VisualProblem[],
  scope: "desktop" | "mobile" | "fullPage",
  plan: VisualPlan,
) {
  const isPremium = plan === "premium";
  const filteredProblems =
    scope === "mobile"
      ? problems.filter((problem) => problem.category === "Mobile UX" || problem.category === "Ladegefuehl")
      : scope === "fullPage"
        ? problems.filter((problem) => problem.category !== "Mobile UX")
        : problems.filter((problem) => problem.category !== "Mobile UX" && problem.category !== "Ladegefuehl");

  return (filteredProblems.length > 0 ? filteredProblems : problems)
    .slice(0, plan === "free" ? 2 : isPremium ? 8 : 6)
    .map((problem, index) => {
      const layer = normalizeVisualLayer(problem.category, problem.title);
      const severity = normalizeVisualSeverity(problem.tone);

      return {
        id: `visual-problem-${scope}-${index}`,
        title: normalizeGermanReportText(problem.title),
        text: normalizeGermanReportText(noteText(problem, isPremium)),
        category: noteCategory(problem.category, problem.title),
        layer,
        severity,
        badge: problem.tone,
        priority: priorityFromSeverity(severity),
        problem: normalizeGermanReportText(problem.text),
        businessImpact: problemImpact(problem),
        action: problemRecommendation(problem),
      } satisfies ScreenshotLightboxNote;
    });
}

function screenshotKeys(result: AnalysisResult) {
  return Object.entries(result.screenshots ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
}

function classifyScreenshotSource(src?: string) {
  if (!src) return "missing";
  if (src.startsWith("/generated-screenshots/")) return "local";
  if (/\/storage\/v1\/object\//.test(src) || src.includes("supabase")) return "storage";
  if (/^https?:\/\//i.test(src)) return "public";
  return "unknown";
}

function buildScreenshotDiagnostic(
  result: AnalysisResult,
  accessLevel: VisualPlan,
  analysisId?: string,
): ScreenshotDiagnostic {
  const metadata = result.metadata;
  const keys = screenshotKeys(result);
  const attempted = metadata?.screenshotVariantsAttempted ?? [];
  const stored = metadata?.screenshotVariantsStored ?? [];
  const desktopUrl = result.screenshots?.viewport ?? result.screenshots?.fullPage ?? result.screenshots?.hero;
  const mobileUrl = result.screenshots?.mobile;
  const source = classifyScreenshotSource(desktopUrl ?? mobileUrl);
  const hasScreenshotError = Boolean(metadata?.screenshotError);
  const isLegacy = attempted.length === 0 && stored.length === 0 && keys.length === 0;
  const reason = hasScreenshotError
    ? "Screenshot-Erstellung wurde beim Analyse-Lauf nicht abgeschlossen."
    : isLegacy
      ? "Legacy Result ohne gespeicherte Screenshot-Daten."
      : source === "local" && process.env.NODE_ENV === "production"
        ? "Lokale Screenshot-URL ist in Production nicht stabil erreichbar."
        : "Screenshot wurde für diesen Lauf nicht gespeichert oder ist nicht mehr erreichbar.";

  return {
    title: "Visuelle Ansicht nicht verfügbar",
    description:
      "Die Analyse bleibt nutzbar, aber der visuelle Seitenüberblick braucht eine gespeicherte Desktop- oder Mobile-Ansicht.",
    reason,
    cta: isLegacy
      ? "Für eine vollständige visuelle Analyse bitte die Analyse neu ausführen."
      : "Analyse neu ausführen oder die visuelle Analyse erneut erzeugen, sobald die Erfassung verfügbar ist.",
    details: [
      `analysisId: ${analysisId ?? "unbekannt"}`,
      `accessLevel: ${accessLevel}`,
      `screenshots keys: ${keys.length ? keys.join(", ") : "keine"}`,
      `desktop url vorhanden: ${desktopUrl ? "ja" : "nein"}`,
      `mobile url vorhanden: ${mobileUrl ? "ja" : "nein"}`,
      `source: ${source}`,
      `attempted: ${attempted.length ? attempted.join(", ") : "unbekannt"}`,
      `stored: ${stored.length ? stored.join(", ") : "keine"}`,
      `reason: ${reason}`,
    ],
  };
}

function ScreenshotDiagnosticPanel({
  diagnostic,
}: {
  diagnostic: ScreenshotDiagnostic;
}) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return (
    <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
        Visueller Seitenüberblick
      </p>
      <h3 className="mt-2 text-xl font-bold">{diagnostic.title}</h3>
      <p className="mt-3 text-sm leading-7">{diagnostic.description}</p>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-white/60 p-4">
        <p className="text-sm font-bold">Diagnose</p>
        <p className="mt-2 text-sm leading-7">{diagnostic.reason}</p>
        <p className="mt-2 text-sm leading-7">{diagnostic.cta}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/analyse"
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Analyse neu ausführen
        </Link>
      </div>
      {isDevelopment ? (
        <pre className="mt-4 overflow-auto rounded-2xl border border-amber-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {diagnostic.details.join("\n")}
        </pre>
      ) : null}
    </div>
  );
}

function MobileScreenshotCard({
  src,
  problems,
  title = "Mobile Vorschau",
  notes,
}: {
  src?: string;
  problems: VisualProblem[];
  title?: string;
  notes?: ScreenshotLightboxNote[];
}) {
  const [failed, setFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFailed(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [src]);

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
            Mobile
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Kleine Ansicht, große Reibung.
          </p>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
          Mobile UX
        </span>
      </div>
      {src && !failed ? (
        <>
          <div className="relative mx-auto mt-4 max-w-[280px] overflow-hidden rounded-[2rem] border-[10px] border-slate-950 bg-white shadow-[0_24px_80px_-52px_rgba(15,23,42,0.5)]">
            <img
              src={src}
              alt="Mobile Vorschau der analysierten Seite"
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-auto w-full object-top"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute right-2 top-2 rounded-full border border-white/50 bg-slate-950/78 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.85)] backdrop-blur-md transition hover:border-cyan-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            >
              Vollansicht
            </button>
            <div className="pointer-events-none absolute inset-0">
              {problems.slice(0, 3).map((problem, index) => (
                <div
                  key={`${problem.category}-${index}`}
                  className="absolute h-8 w-8 rounded-full border-2 border-white bg-rose-500/90 text-center text-xs font-bold leading-7 text-white shadow-[0_0_24px_rgba(244,63,94,0.75)]"
                  style={{
                    left: `${[12, 70, 42][index]}%`,
                    top: `${[16, 38, 62][index]}%`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
          <ScreenshotLightbox
            images={[{
              src,
              alt: "Mobile Vorschau der analysierten Seite",
              title,
              notes: notes ?? notesFromProblems(problems, "mobile", "full"),
            }]}
            currentIndex={0}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            onSelect={() => undefined}
          />
        </>
      ) : (
        <div className="mt-4">
          <ScreenshotFallback />
        </div>
      )}
    </article>
  );
}

export function VisualAuditSection({
  result,
  plan = "premium",
  analysisId,
}: {
  result: AnalysisResult;
  plan?: VisualPlan;
  analysisId?: string;
}) {
  const screenshots = result.screenshots;
  const desktopImage = screenshots?.viewport ?? screenshots?.fullPage ?? screenshots?.hero;
  const isPremium = plan === "premium";
  const isFree = plan === "free";
  const problems = buildVisualProblems(result);
  const visibleProblems = isPremium ? problems : problems.slice(0, isFree ? 2 : 4);
  const hotspots =
    result.visualMap && desktopImage
      ? getVisualHotspots(result, screenshots?.viewport ? "viewport" : "fullPage").slice(0, isFree ? 2 : isPremium ? 10 : 8)
      : [];
  const desktopScope = screenshots?.viewport ? "desktop" : "fullPage";
  const screenshotDiagnostic = buildScreenshotDiagnostic(result, plan, analysisId);

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.35)] sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Visuelle Website-Analyse
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {isPremium
              ? "Hier sieht man sofort, wo die Seite Vertrauen und Anfragen verliert."
              : isFree
                ? "Erste visuelle Signale zeigen, wo Aufmerksamkeit und Vertrauen kippen können."
              : "Kompakter visueller Check der wichtigsten Reibungspunkte."}
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            {isPremium
              ? "Die nummerierten Marker erklären die sichtbaren Problemzonen in Alltagssprache: was stört, warum es wirtschaftlich relevant ist und welche Änderung zuerst sinnvoll ist."
              : isFree
                ? "Die kostenlose Vorschau zeigt wenige echte Marker und sperrt tiefere Ebenen bewusst an. Die Vollanalyse öffnet alle visuellen Hinweise."
                : "Die Vollanalyse zeigt alle zentralen Marker, Ebenenfilter und eine große Detailansicht. Premium ergänzt die strategische Priorisierung."}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          Bewertung: Kritisch / Wichtig / Chance
        </div>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-5">
          {desktopImage && result.visualMap ? (
            <VisualOverlay
              imageSrc={desktopImage}
              imageAlt="Desktop-Vorschau der analysierten Seite mit Markierungen"
              title="Desktop mit Markierungen"
              visualMap={result.visualMap}
              hotspots={hotspots}
              target={screenshots?.viewport ? "viewport" : "fullPage"}
              suggestions={result.aiSuggestions}
              notes={notesFromProblems(problems, desktopScope, plan)}
              variant={isPremium ? "premium" : "compact"}
              plan={plan}
            />
          ) : (
            <ScreenshotDiagnosticPanel diagnostic={screenshotDiagnostic} />
          )}
          {!isFree && screenshots?.mobile ? (
            <MobileScreenshotCard
              src={screenshots?.mobile}
              problems={problems}
              title="Mobile Vorschau"
              notes={notesFromProblems(problems, "mobile", plan)}
            />
          ) : null}
        </div>

        <div className="grid gap-3">
          {visibleProblems.map((problem, index) => (
            <article
              key={`${problem.category}-${problem.title}`}
              className={`rounded-2xl border p-4 ${toneClasses[problem.tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                    {problem.category}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{index + 1}. {problem.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${toneBadgeClasses[problem.tone]}`}>
                  {problem.tone}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 opacity-90">{problem.text}</p>
              {isPremium ? (
                <div className="mt-3 grid gap-2 rounded-xl border border-white/50 bg-white/45 p-3 text-sm leading-6">
                  <p><strong>Was bedeutet das konkret?</strong> {problem.text}</p>
                  <p><strong>Warum kostet das Anfragen/Käufe?</strong> {problemImpact(problem)}</p>
                  <p><strong>Empfohlene Änderung:</strong> {problemRecommendation(problem)}</p>
                </div>
              ) : null}
            </article>
          ))}
          {!isPremium ? (
            <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-950">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                {isFree ? "Vollständige visuelle Analyse" : "Strategische Premium-Ebene"}
              </p>
              <h3 className="mt-2 text-lg font-bold">
                {isFree ? "Alle Marker und Ebenen für 5 EUR freischalten" : "Strategische Priorisierung freischalten"}
              </h3>
              <p className="mt-3 text-sm leading-7">
                {isFree
                  ? "Die Vollanalyse zeigt die komplette Screenshot-Auswertung, Blickführung, geschäftliche Wirkung und mobile Reibung."
                  : "Premium verdichtet die visuellen Hinweise zu priorisierten Empfehlungen, geschäftlichen Prioritäten und einem 7-Tage-Fahrplan."}
              </p>
            </article>
          ) : null}
        </div>
      </div>

      {isPremium ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Was bedeutet das konkret?</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Die Seite wird wie ein Erstbesuch gelesen: Was faellt sofort auf, was fehlt und welcher Klick wirkt am wahrscheinlichsten?
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Warum kostet das?</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Unsichtbare CTAs, schwache Trust-Signale oder unklare Hierarchie senken die Sicherheit des Besuchers genau vor der Entscheidung.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Vorher-nachher-Denkweise</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Ziel ist kein versprochenes Redesign, sondern eine klare Richtung: was nach vorne muss, was weniger Gewicht braucht und welcher nächste Schritt sichtbarer wird.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
