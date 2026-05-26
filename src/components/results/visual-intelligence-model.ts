import { VisualHotspot } from "@/lib/result-ui";

export const VISUAL_LAYERS = [
  "Conversion",
  "Trust",
  "UX",
  "Mobile",
  "SEO",
  "AI Visibility",
] as const;

export type VisualLayer = (typeof VISUAL_LAYERS)[number];
export type VisualLayerFilter = "all" | VisualLayer | "Strategy";
export type VisualSeverity = "critical" | "important" | "opportunity";

export type VisualPlan = "free" | "full" | "premium";

export const layerAccentClasses: Record<VisualLayer | "Strategy", string> = {
  Conversion: "border-cyan-300/70 bg-cyan-300/12 text-cyan-950",
  Trust: "border-emerald-300/70 bg-emerald-300/12 text-emerald-950",
  UX: "border-violet-300/70 bg-violet-300/12 text-violet-950",
  Mobile: "border-sky-300/70 bg-sky-300/12 text-sky-950",
  SEO: "border-amber-300/70 bg-amber-300/12 text-amber-950",
  "AI Visibility": "border-fuchsia-300/70 bg-fuchsia-300/12 text-fuchsia-950",
  Strategy: "border-slate-300 bg-slate-900/5 text-slate-950",
};

export const severityLabel: Record<VisualSeverity, string> = {
  critical: "Kritisch",
  important: "Wichtig",
  opportunity: "Chance",
};

export const severityClasses: Record<
  VisualSeverity,
  { marker: string; dot: string; badge: string; surface: string; glow: string }
> = {
  critical: {
    marker: "border-rose-400/90 bg-rose-400/14",
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800",
    surface: "border-rose-200 bg-rose-50/80",
    glow: "shadow-[0_0_0_5px_rgba(244,63,94,0.16),0_18px_60px_-32px_rgba(244,63,94,0.8)]",
  },
  important: {
    marker: "border-amber-400/90 bg-amber-300/16",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
    surface: "border-amber-200 bg-amber-50/80",
    glow: "shadow-[0_0_0_5px_rgba(245,158,11,0.14),0_18px_60px_-34px_rgba(245,158,11,0.75)]",
  },
  opportunity: {
    marker: "border-emerald-400/90 bg-emerald-300/14",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    surface: "border-emerald-200 bg-emerald-50/80",
    glow: "shadow-[0_0_0_5px_rgba(16,185,129,0.13),0_18px_60px_-34px_rgba(16,185,129,0.65)]",
  },
};

export function normalizeVisualLayer(...values: Array<string | undefined | null>): VisualLayer {
  const text = values.filter(Boolean).join(" ").toLowerCase();

  if (/cta|conversion|checkout|lead|formular|form|kauf|anfrage|button|naechster|nächster/.test(text)) {
    return "Conversion";
  }

  if (/trust|vertrauen|proof|siegel|bewertung|review|kontakt|datenschutz|impressum|sicher/.test(text)) {
    return "Trust";
  }

  if (/mobile|responsive|smartphone|telefon/.test(text)) {
    return "Mobile";
  }

  if (/seo|meta|heading|h1|h2|sitemap|index|such|google|title/.test(text)) {
    return "SEO";
  }

  if (/ai|ki|geo|entity|structured|schema|daten|visibility|sichtbarkeit/.test(text)) {
    return "AI Visibility";
  }

  return "UX";
}

export function normalizeVisualSeverity(
  tone?: VisualHotspot["tone"] | string,
  priority?: string,
): VisualSeverity {
  const text = `${tone ?? ""} ${priority ?? ""}`.toLowerCase();

  if (/problem|critical|kritisch|error|high/.test(text)) {
    return "critical";
  }

  if (/warning|wichtig|important|medium|improvement/.test(text)) {
    return "important";
  }

  return "opportunity";
}

export function priorityFromSeverity(severity: VisualSeverity) {
  if (severity === "critical") return "kritisch";
  if (severity === "important") return "wichtig";
  return "chance";
}

export function isLayerVisible(layer: VisualLayer | "Strategy" | undefined, filter: VisualLayerFilter) {
  return filter === "all" || layer === filter;
}

export function planLimits(plan: VisualPlan) {
  if (plan === "free") {
    return { hotspots: 2, notes: 2, locked: true, strategy: false };
  }

  if (plan === "full") {
    return { hotspots: 10, notes: 10, locked: false, strategy: true };
  }

  return { hotspots: 12, notes: 12, locked: false, strategy: true };
}
