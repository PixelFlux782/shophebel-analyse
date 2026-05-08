import {
  AiSuggestion,
  AnalysisResult,
  ElementBox,
  Finding,
  PriorityLevel,
  Recommendation,
  VisualMap,
} from "@/types/analysis";
import { buildFindingKey } from "@/lib/ai/suggestion-helpers";

export const FREE_VISIBLE_FINDINGS_LIMIT = 5;
export const FREE_VISIBLE_RECOMMENDATIONS_LIMIT = 3;
export const LOCKED_FINDINGS_PREVIEW_LIMIT = 3;
const MAX_VISUAL_HOTSPOTS = 12;

export type VisualHotspotTone = "problem" | "improvement" | "good";
export type VisualHotspotTarget = "viewport" | "fullPage";

export interface VisualHotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: VisualHotspotTone;
  title: string;
  description: string;
  target: VisualHotspotTarget;
  label?: string;
  linkedFindingKey?: string;
}

export function getScoreLabel(score: number) {
  if (score >= 80) {
    return "stark";
  }

  if (score >= 60) {
    return "solide";
  }

  if (score >= 40) {
    return "Potenzial";
  }

  return "kritisch";
}

export function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      glow: "from-emerald-500/80 to-teal-500/80 shadow-emerald-500/20",
      progress: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
      surface: "border-emerald-500/20 bg-slate-900/50 backdrop-blur-xl transition-all hover:bg-slate-900/70 hover:border-emerald-500/40",
    };
  }

  if (score >= 60) {
    return {
      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      glow: "from-amber-500/80 to-orange-500/80 shadow-amber-500/20",
      progress: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
      surface: "border-amber-500/20 bg-slate-900/50 backdrop-blur-xl transition-all hover:bg-slate-900/70 hover:border-amber-500/40",
    };
  }

  return {
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    glow: "from-rose-500/80 to-pink-500/80 shadow-rose-500/20",
    progress: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    surface: "border-rose-500/20 bg-slate-900/50 backdrop-blur-xl transition-all hover:bg-slate-900/70 hover:border-rose-500/40",
  };
}

export function getPriorityOrder(priority: PriorityLevel) {
  const order: Record<PriorityLevel, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return order[priority];
}

export function getRecommendationWeight(recommendation: Recommendation) {
  if (typeof recommendation.weight === "number") {
    return recommendation.weight;
  }

  const impactWeight: Record<PriorityLevel, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const effortWeight: Record<PriorityLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  return impactWeight[recommendation.impact] * 10 + effortWeight[recommendation.effort];
}

export function getRecommendationLabel(recommendation: Recommendation) {
  if (recommendation.impact === "high" && recommendation.effort === "low") {
    return "Schnellster Hebel";
  }

  if (recommendation.impact === "high" && recommendation.effort !== "low") {
    return "Groesster Impact";
  }

  return "Langfristige Optimierung";
}

export function getOverallStatusLabel(score: number) {
  if (score >= 80) {
    return "stark";
  }

  if (score >= 60) {
    return "solide mit Potenzial";
  }

  return "hoher Optimierungsbedarf";
}

export function getAnalysisSummary(result: AnalysisResult) {
  const { overallScore, categoryScores } = result;
  const sentences: string[] = [];

  if (overallScore >= 80) {
    sentences.push(
      "Deine Startseite zeigt bereits eine starke Gesamtbasis und wirkt in mehreren Bereichen ueberzeugend.",
    );
  } else if (overallScore >= 60) {
    sentences.push(
      "Deine Startseite hat eine solide Basis, aber es gibt noch einige klare Hebel fuer mehr Wirkung.",
    );
  } else {
    sentences.push(
      "Deine Startseite hat aktuell deutlichen Optimierungsbedarf und verschenkt an mehreren Stellen Potenzial.",
    );
  }

  const seoScore = categoryScores.seo?.score ?? result.categories?.seo.score ?? 0;
  const trustScore = categoryScores.trust?.score ?? result.categories?.trust.score ?? 0;
  const conversionScore =
    categoryScores.conversion?.score ?? result.categories?.conversion.score ?? 0;
  const uxScore = categoryScores.ux?.score ?? result.categories?.design.score ?? 0;

  if (seoScore >= 80) {
    sentences.push(
      "Die Seite ist fuer Auffindbarkeit bereits gut vorbereitet und gibt Besuchern eine solide Orientierung.",
    );
  } else if (seoScore < 60) {
    sentences.push(
      "Google und KI bekommen noch zu wenig klare Signale, worum es auf der Seite geht und warum Besucher handeln sollten.",
    );
  }

  if (trustScore < 60) {
    sentences.push(
      "Besonders beim Vertrauen fehlen offenbar Signale, die Sicherheit und Seriositaet sofort sichtbar machen.",
    );
  }

  if (conversionScore < 60) {
    sentences.push(
      "Auch beim Weg zur Anfrage oder zum Kauf gibt es Reibung, etwa beim naechsten Schritt, Nutzenargumenten oder Vertrauensbelegen.",
    );
  }

  if (uxScore < 60) {
    sentences.push(
      "Die Nutzerfuehrung wirkt noch nicht durchgaengig klar und koennte Inhalte besser ordnen.",
    );
  }

  return sentences.slice(0, 4).join(" ");
}

export function getVisibleFindings<T extends { priority: PriorityLevel; status: string }>(
  findings: T[],
  isPremium: boolean,
) {
  const sortedFindings = [...findings].sort((left, right) => {
    const priorityDifference = getPriorityOrder(left.priority) - getPriorityOrder(right.priority);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const statusOrder = { error: 0, warning: 1, success: 2 };
    return (
      statusOrder[left.status as keyof typeof statusOrder] -
      statusOrder[right.status as keyof typeof statusOrder]
    );
  });

  return isPremium
    ? sortedFindings
    : sortedFindings.slice(0, FREE_VISIBLE_FINDINGS_LIMIT);
}

export function getLockedFindingsPreview<T extends { priority: PriorityLevel; status: string }>(
  findings: T[],
) {
  const sortedFindings = getVisibleFindings(findings, true);
  return sortedFindings.slice(
    FREE_VISIBLE_FINDINGS_LIMIT,
    FREE_VISIBLE_FINDINGS_LIMIT + LOCKED_FINDINGS_PREVIEW_LIMIT,
  );
}

export function getVisibleRecommendations(
  recommendations: Recommendation[],
  isPremium: boolean,
) {
  const sortedRecommendations = [...recommendations].sort(
    (left, right) => getRecommendationWeight(left) - getRecommendationWeight(right),
  );

  return isPremium
    ? sortedRecommendations
    : sortedRecommendations.slice(0, FREE_VISIBLE_RECOMMENDATIONS_LIMIT);
}

function getFindingTone(finding: Finding): VisualHotspotTone {
  if (finding.status === "success") {
    return "good";
  }

  if (finding.status === "error") {
    return "problem";
  }

  return "improvement";
}

function normalizeText(value: string) {
  return value.toLowerCase();
}

function clampBoxToTarget(
  box: ElementBox,
  visualMap: VisualMap,
  target: VisualHotspotTarget,
): ElementBox | null {
  const maxWidth = target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth;
  const maxHeight = target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight;
  const minX = Math.max(0, box.x);
  const minY = Math.max(0, box.y);
  const maxX = Math.min(maxWidth, box.x + box.width);
  const maxY = Math.min(maxHeight, box.y + box.height);

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return {
    ...box,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createRegionBox(
  visualMap: VisualMap,
  target: VisualHotspotTarget,
  region: "hero" | "footer",
): ElementBox {
  const width = target === "viewport" ? visualMap.viewportWidth : visualMap.pageWidth;
  const height = target === "viewport" ? visualMap.viewportHeight : visualMap.pageHeight;

  if (region === "hero") {
    return {
      x: width * 0.08,
      y: height * 0.05,
      width: width * 0.84,
      height: Math.max(96, height * 0.28),
      label: "Oberer Seitenbereich",
    };
  }

  return {
    x: width * 0.08,
    y: Math.max(0, height * 0.78),
    width: width * 0.84,
    height: Math.max(96, height * 0.14),
    label: "Unterer Seitenbereich",
  };
}

function pickBoxForFinding(
  finding: Finding,
  visualMap: VisualMap,
  target: VisualHotspotTarget,
): ElementBox | null {
  const text = normalizeText(`${finding.title} ${finding.description}`);
  const prefersHero = /cta|call to action|hero|starten|bestellen|kaufen|anfragen/.test(text);
  const prefersButtons = /button|cta|call to action|starten|bestellen|kaufen|anfragen/.test(text);
  const prefersForms = /formular|form|kontakt|anfrage/.test(text);
  const prefersHeadings = /h1|h2|heading|ueberschrift|struktur|title|meta|canonical|open graph|og:/.test(
    text,
  );
  const prefersImages = /bild|bilder|image|alt/.test(text);
  const prefersLinks = /link|impressum|datenschutz|kontakt|footer|trust|versand|rueckgabe|zahlung/.test(
    text,
  );
  const isMissingSignal = /fehlt|fehlend|keine|kein|zu wenig/.test(text);

  const pickFirst = (boxes: ElementBox[]) => {
    const adjustedBoxes =
      target === "viewport"
        ? boxes
            .map((box) => clampBoxToTarget(box, visualMap, target))
            .filter((box): box is ElementBox => Boolean(box))
        : boxes;

    return adjustedBoxes[0] ?? null;
  };

  if (prefersButtons && isMissingSignal) {
    return createRegionBox(visualMap, target, "hero");
  }

  if (prefersButtons && !isMissingSignal) {
    return pickFirst(visualMap.buttons) ?? createRegionBox(visualMap, target, "hero");
  }

  if (prefersForms) {
    return (
      pickFirst(visualMap.forms) ??
      pickFirst(visualMap.buttons) ??
      createRegionBox(visualMap, target, "hero")
    );
  }

  if (prefersHeadings) {
    return pickFirst(visualMap.headings) ?? createRegionBox(visualMap, target, "hero");
  }

  if (prefersImages) {
    return pickFirst(visualMap.images) ?? createRegionBox(visualMap, target, "hero");
  }

  if (prefersLinks) {
    return pickFirst(visualMap.links) ?? createRegionBox(visualMap, target, "footer");
  }

  if (prefersHero || finding.category === "conversion") {
    if (isMissingSignal) {
      return createRegionBox(visualMap, target, "hero");
    }

    return (
      pickFirst(visualMap.buttons) ??
      pickFirst(visualMap.headings) ??
      createRegionBox(visualMap, target, "hero")
    );
  }

  if (finding.category === "trust") {
    return (
      pickFirst(visualMap.links) ??
      pickFirst(visualMap.forms) ??
      createRegionBox(visualMap, target, "footer")
    );
  }

  if (finding.category === "seo" || finding.category === "ux") {
    return pickFirst(visualMap.headings) ?? createRegionBox(visualMap, target, "hero");
  }

  return createRegionBox(visualMap, target, "hero");
}

export function getVisualHotspots(
  result: AnalysisResult,
  target: VisualHotspotTarget = "fullPage",
) {
  if (!result.visualMap) {
    return [];
  }

  const visualMap = result.visualMap;
  const sortedFindings = getVisibleFindings(result.findings, true).slice(0, MAX_VISUAL_HOTSPOTS);
  const seenKeys = new Set<string>();

  return sortedFindings.reduce<VisualHotspot[]>((hotspots, finding, index) => {
    const box = pickBoxForFinding(finding, visualMap, target);
    const findingKey = buildFindingKey(finding);

    if (!box) {
      return hotspots;
    }

    const key = `${Math.round(box.x)}-${Math.round(box.y)}-${Math.round(box.width)}-${Math.round(box.height)}-${finding.title}`;

    if (seenKeys.has(key)) {
      return hotspots;
    }

    seenKeys.add(key);
    hotspots.push({
      id: `hotspot-${findingKey}-${index}`,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      title: finding.title,
      description: finding.description,
      label: box.label,
      tone: getFindingTone(finding),
      target,
      linkedFindingKey: findingKey,
    });

    return hotspots;
  }, []);
}

export function getSuggestionForHotspot(
  suggestions: AiSuggestion[] | undefined,
  hotspot: VisualHotspot,
) {
  if (!suggestions || !hotspot.linkedFindingKey) {
    return undefined;
  }

  return suggestions.find(
    (suggestion) =>
      suggestion.linkedFindingKey === hotspot.linkedFindingKey ||
      suggestion.hotspotId === hotspot.id,
  );
}
