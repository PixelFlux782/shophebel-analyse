import {
  AnalysisOpportunity,
  OpportunityEffort,
  OpportunitySeverity,
  OpportunitySourceType,
} from "@/types/analysis";

type OpportunityInput = {
  revenueBlockers?: unknown[];
  measures?: unknown[];
  findings?: unknown[];
  aiSuggestions?: unknown[];
  overallScore?: number;
  url?: string;
};

type SourceCandidate = {
  title: string;
  description: string;
  category: string;
  severity: OpportunitySeverity;
  businessImpact: string;
  lostRevenueHypothesis?: string;
  aiOpportunity: string;
  suggestedModule: string;
  suggestedService: string;
  implementationEffort: OpportunityEffort;
  expectedEffect: string;
  recurringPotential: boolean;
  ctaLabel: string;
  ctaHref: string;
  sourceType: OpportunitySourceType;
  priorityScore: number;
};

const MAX_OPPORTUNITIES = 6;

const moduleByCategory: Record<string, string> = {
  vertrauen: "Trust Booster Modul",
  trust: "Trust Booster Modul",
  proof: "Trust Booster Modul",
  reputation: "Review & Reputation Flow",
  bewertungen: "Review & Reputation Flow",
  klarheit: "Content Automation",
  content: "Content Automation",
  seo: "AI Visibility Check",
  sichtbarkeit: "AI Visibility Check",
  cta: "Conversion Quick Wins",
  conversion: "Conversion Quick Wins",
  lead: "Anfrage-Erfassung",
  kontakt: "Anfrage-Erfassung",
  "mobile ux": "Performance & UX Sprint",
  ux: "Performance & UX Sprint",
  design: "Conversion Quick Wins",
  ladegefuehl: "Performance & UX Sprint",
  performance: "Performance & UX Sprint",
  "ai-sichtbarkeit": "AI Visibility Check",
  aivisibility: "AI Visibility Check",
  lokal: "Local Growth Booster",
  local: "Local Growth Booster",
  checkout: "Checkout Friction Audit",
};

const serviceByModule: Record<string, string> = {
  "Anfrage-Erfassung": "Conversion Sprint",
  "Trust Booster Modul": "Trust & Proof Sprint",
  "Conversion Quick Wins": "Quick Fix Sprint",
  "AI Visibility Check": "AI Visibility Sprint",
  "Smart FAQ Assistant": "AI Visibility Sprint",
  "Content Automation": "Content Automation Setup",
  "Review & Reputation Flow": "Trust & Proof Sprint",
  "Local Growth Booster": "Local Growth Sprint",
  "Checkout Friction Audit": "Conversion Sprint",
  "Performance & UX Sprint": "Quick Fix Sprint",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value: string): string {
  return (
    normalizeKey(value)
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "opportunity"
  );
}

function toSeverity(value: unknown, fallback: OpportunitySeverity = "medium"): OpportunitySeverity {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }

  if (value === "hoch" || value === "error") {
    return "high";
  }

  if (value === "mittel" || value === "warning") {
    return "medium";
  }

  if (value === "niedrig" || value === "success") {
    return "low";
  }

  return fallback;
}

function toEffort(value: unknown): OpportunityEffort {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  if (value === "hoch") {
    return "high";
  }

  if (value === "mittel") {
    return "medium";
  }

  return "low";
}

function scoreSeverity(severity: OpportunitySeverity): number {
  return { critical: 95, high: 78, medium: 55, low: 32 }[severity];
}

function impactBoost(value: unknown): number {
  if (value === "hoch" || value === "high") {
    return 16;
  }

  if (value === "mittel" || value === "medium") {
    return 9;
  }

  return 3;
}

function effortBoost(effort: OpportunityEffort): number {
  return { low: 12, medium: 6, high: 0 }[effort];
}

function hasKeyword(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

function moduleFor(category: string, title: string): string {
  const combined = normalizeKey(`${category} ${title}`);

  if (
    hasKeyword(
      combined,
      /ki sichtbarkeit|ai sichtbarkeit|aivisibility|llm|chatgpt|google|suchmaschine|suchsystem|antwortsystem|schema|structured data/,
    )
  ) {
    return "AI Visibility Check";
  }

  if (hasKeyword(combined, /faq|fragen|antwort|einwand|kundenfrage|wissensbereich/)) {
    return "Smart FAQ Assistant";
  }

  if (hasKeyword(combined, /review|bewertung|reputation|sterne|referenz|testimonial/)) {
    return "Review & Reputation Flow";
  }

  if (hasKeyword(combined, /lokal|standort|adresse|local|maps|near me|gebiet|region|filiale/)) {
    return "Local Growth Booster";
  }

  if (hasKeyword(combined, /checkout|warenkorb|zahlung|kasse|bestellung|versand|retoure|payment/)) {
    return "Checkout Friction Audit";
  }

  if (hasKeyword(combined, /lead|kontakt|formular|anfrage|termin|rueckruf|angebot|erstgespraech/)) {
    return "Anfrage-Erfassung";
  }

  if (hasKeyword(combined, /vertrauen|trust|proof|sicherheit|garantie|zertifikat|beleg|vertrauensbruch/)) {
    return "Trust Booster Modul";
  }

  if (hasKeyword(combined, /cta|button|conversion|abschluss|kaufentscheidung|nutzerfuhrung|next step/)) {
    return "Conversion Quick Wins";
  }

  if (hasKeyword(combined, /content|text|copy|leistung|positionierung|botschaft|automatisierung/)) {
    return "Content Automation";
  }

  if (hasKeyword(combined, /mobile|ux|performance|ladezeit|ladegefuhl|core web vitals|geschwindigkeit/)) {
    return "Performance & UX Sprint";
  }

  return moduleByCategory[normalizeKey(category)] ?? "Conversion Quick Wins";
}

function ctaFor(sourceType: OpportunitySourceType, severity: OpportunitySeverity, suggestedModule: string) {
  if (sourceType === "fallback") {
    return { ctaLabel: severity === "medium" ? "Roadmap freischalten" : "Diesen Hebel prüfen", ctaHref: "/analyse" };
  }

  if (
    suggestedModule === "Anfrage-Erfassung" ||
    suggestedModule === "Smart FAQ Assistant" ||
    suggestedModule === "AI Visibility Check" ||
    suggestedModule === "Content Automation"
  ) {
    return { ctaLabel: "KI-Modul anfragen", ctaHref: "/#kontakt" };
  }

  if (suggestedModule === "Conversion Quick Wins" || suggestedModule === "Performance & UX Sprint") {
    return {
      ctaLabel: severity === "critical" || severity === "high" ? "Quick Fix starten" : "Diesen Hebel prüfen",
      ctaHref: severity === "critical" || severity === "high" ? "/#kontakt" : "/leistungen",
    };
  }

  if (severity === "critical" || severity === "high") {
    return { ctaLabel: "Umsetzung besprechen", ctaHref: "/#kontakt" };
  }

  if (sourceType === "finding" || sourceType === "aiSuggestion") {
    return { ctaLabel: "Roadmap freischalten", ctaHref: "/preise" };
  }

  return { ctaLabel: "Diesen Hebel prüfen", ctaHref: "/leistungen" };
}

function candidateId(sourceType: OpportunitySourceType, index: number, title: string): string {
  return `${sourceType}-${index + 1}-${slug(title)}`;
}

function createOpportunity(candidate: SourceCandidate, index: number): AnalysisOpportunity {
  return {
    ...candidate,
    id: candidateId(candidate.sourceType, index, candidate.title),
    priorityScore: Math.round(Math.max(0, Math.min(100, candidate.priorityScore))),
  };
}

function revenueBlockerCandidates(items: unknown[] = []): SourceCandidate[] {
  return items.map((item, index) => {
    const record = asRecord(item);
    const title = text(record.problem) ?? "Umsatzbremse mit direktem Conversion-Hebel";
    const category = text(record.category) ?? "Conversion";
    const effort = toEffort(record.estimatedEffort);
    const severity = toSeverity(record.estimatedImpact, "high");
    const suggestedModule = moduleFor(category, title);
    const cta = ctaFor("revenueBlocker", severity, suggestedModule);

    return {
      title,
      description:
        text(record.action) ??
        "Diese Stelle sollte in einen klaren nächsten Schritt übersetzt werden, damit interessierte Besucher nicht kurz vor der Anfrage abbrechen.",
      category,
      severity,
      businessImpact:
        text(record.whyItCostsCustomers) ??
        "Unklare Nutzerführung erzeugt verlorene Anfragen, weil die Kaufentscheidung nicht genug Sicherheit bekommt.",
      lostRevenueHypothesis:
        "Wenn dieser Hebel greift, finden mehr qualifizierte Besucher den Weg zur Anfrage oder zum Kauf.",
      aiOpportunity:
        "Ein kleines KI-Modul statt großem Relaunch kann Botschaft, Vertrauenselemente und Button-Varianten schneller testbar machen.",
      suggestedModule,
      suggestedService: serviceByModule[suggestedModule] ?? "Conversion Sprint",
      implementationEffort: effort,
      expectedEffect: "Mehr Vertrauen, klarere Nutzerführung und mehr qualifizierte Anfragen aus bestehendem Traffic.",
      recurringPotential:
        suggestedModule === "Review & Reputation Flow" ||
        suggestedModule === "AI Visibility Check" ||
        suggestedModule === "Content Automation",
      ctaLabel: cta.ctaLabel,
      ctaHref: cta.ctaHref,
      sourceType: "revenueBlocker",
      priorityScore:
        scoreSeverity(severity) +
        impactBoost(record.estimatedImpact) +
        effortBoost(effort) +
        Math.max(0, 8 - (numberValue(record.priority) ?? index + 1)),
    };
  });
}

function measureCandidates(items: unknown[] = []): SourceCandidate[] {
  return items.map((item, index) => {
    const record = asRecord(item);
    const title = text(record.title) ?? "Konkreten Website-Hebel sauber umsetzen";
    const category = text(record.category) ?? "Conversion";
    const effort = toEffort(record.effort);
    const severity = toSeverity(record.impact, "medium");
    const suggestedModule = moduleFor(category, title);
    const cta = ctaFor("measure", severity, suggestedModule);

    return {
      title,
      description:
        text(record.description) ??
        "Aus der Analyse ergibt sich ein kompakter Hebel, der die Kaufentscheidung sichtbarer und leichter macht.",
      category,
      severity,
      businessImpact: `Dieser Hebel verbessert ${category} genau dort, wo Besucher Vertrauen aufbauen, vergleichen oder den nächsten Schritt suchen.`,
      aiOpportunity:
        "KI kann Texte, Reihenfolge und Varianten vorbereiten, sodass aus einer Empfehlung schneller ein wiederkehrender Hebel wird.",
      suggestedModule,
      suggestedService: serviceByModule[suggestedModule] ?? "Conversion Sprint",
      implementationEffort: effort,
      expectedEffect: "Sichtbare Verbesserung der Anfrage- oder Kaufstrecke ohne kompletten Relaunch.",
      recurringPotential:
        suggestedModule === "Content Automation" ||
        suggestedModule === "AI Visibility Check" ||
        suggestedModule === "Review & Reputation Flow",
      ctaLabel: cta.ctaLabel,
      ctaHref: cta.ctaHref,
      sourceType: "measure",
      priorityScore:
        scoreSeverity(severity) + impactBoost(record.impact) + effortBoost(effort) - index * 2,
    };
  });
}

function findingCandidates(items: unknown[] = []): SourceCandidate[] {
  return items.map((item, index) => {
    const record = asRecord(item);
    const title = text(record.title) ?? "Analyse-Finding in Business-Hebel übersetzen";
    const category = text(record.category) ?? "Analyse";
    const severity = toSeverity(record.priority ?? record.status, "medium");
    const suggestedModule = moduleFor(category, title);
    const cta = ctaFor("finding", severity, suggestedModule);

    return {
      title,
      description:
        text(record.description) ??
        "Dieses Signal sollte als Geschäftschance behandelt werden, nicht als reine Audit-Notiz.",
      category,
      severity,
      businessImpact:
        "Das Signal kann verlorene Anfragen verursachen, einen Vertrauensbruch auslösen oder die Sichtbarkeit in Google und KI-Antwortsystemen begrenzen.",
      aiOpportunity:
        "KI kann daraus konkrete Text-, Struktur- oder FAQ-Varianten ableiten und nach Wirkung auf Kaufentscheidung und Nutzerführung priorisieren.",
      suggestedModule,
      suggestedService: serviceByModule[suggestedModule] ?? "Quick Fix Sprint",
      implementationEffort: severity === "high" ? "medium" : "low",
      expectedEffect: "Mehr Verständlichkeit und weniger Reibung auf dem Weg zur Anfrage oder zum Kauf.",
      recurringPotential: suggestedModule === "AI Visibility Check" || suggestedModule === "Content Automation",
      ctaLabel: cta.ctaLabel,
      ctaHref: cta.ctaHref,
      sourceType: "finding",
      priorityScore: scoreSeverity(severity) + 4 - index * 2,
    };
  });
}

function aiSuggestionCandidates(items: unknown[] = []): SourceCandidate[] {
  return items.map((item, index) => {
    const record = asRecord(item);
    const title = text(record.title) ?? "KI-Vorschlag in umsetzbaren Wachstumshebel verwandeln";
    const category = text(record.category) ?? "AI";
    const severity = toSeverity(record.expectedImpact, "medium");
    const suggestedModule = moduleFor(category, title);
    const cta = ctaFor("aiSuggestion", severity, suggestedModule);

    return {
      title,
      description:
        text(record.summary) ??
        "Der KI-Vorschlag kann als kleiner Modulbaustein starten und eine größere Relaunch-Diskussion ersetzen.",
      category,
      severity,
      businessImpact:
        "Die Website gewinnt an Klarheit, Antworttiefe und Sichtbarkeit in Google und KI-Antwortsystemen.",
      aiOpportunity:
        "Aus dem Vorschlag lassen sich strukturierte Inhalte, FAQ-Antworten oder CTA-Varianten als wiederkehrender Hebel vorbereiten.",
      suggestedModule,
      suggestedService: serviceByModule[suggestedModule] ?? "Premium Roadmap",
      implementationEffort: "low",
      expectedEffect: "Schneller von Analyse zu testbarer Verbesserung kommen, ohne die Website neu zu denken.",
      recurringPotential: true,
      ctaLabel: cta.ctaLabel,
      ctaHref: cta.ctaHref,
      sourceType: "aiSuggestion",
      priorityScore: scoreSeverity(severity) - index * 2,
    };
  });
}

function fallbackCandidates(overallScore?: number, url?: string): SourceCandidate[] {
  const score = typeof overallScore === "number" ? overallScore : undefined;
  const target = url ? ` für ${url}` : "";

  return [
    {
      title: "Top-Hebel für mehr Anfragen priorisieren",
      description: `Die Analyse liefert noch keine eindeutigen Einzelprobleme${target}. Ein strukturierter Opportunity-Check kann die wichtigsten Umsatzhebel sichtbar machen.`,
      category: "Conversion",
      severity: score !== undefined && score < 70 ? "medium" : "low",
      businessImpact:
        "Ohne klare Priorisierung werden oft kleine Website-Aufgaben erledigt, während echte Anfrage-Hebel liegen bleiben.",
      aiOpportunity:
        "KI kann Seitenbotschaft, CTA, Trust-Signale und Kundenfragen zu einem kompakten Chancenbild verdichten.",
      suggestedModule: "Conversion Quick Wins",
      suggestedService: "Premium Roadmap",
      implementationEffort: "low",
      expectedEffect: "Ein klarer erster Fahrplan für Verbesserungen mit geringem Risiko.",
      recurringPotential: false,
      ctaLabel: "Diesen Hebel prüfen",
      ctaHref: "/analyse",
      sourceType: "fallback",
      priorityScore: 58,
    },
    {
      title: "KI-Sichtbarkeit und Antwortfähigkeit ausbauen",
      description:
        "Viele Websites beantworten Kundenfragen noch nicht so klar, dass Suchmaschinen und KI-Systeme sie verlässlich aufgreifen.",
      category: "AI-Sichtbarkeit",
      severity: "medium",
      businessImpact:
        "Wer in Google, lokalen Suchen und KI-Antwortsystemen nicht eindeutig verstanden wird, verliert Nachfrage bevor sie die Website erreicht.",
      aiOpportunity:
        "KI kann echte Kundenfragen, Leistungsbeschreibungen und lokale Signale in wiederverwendbare Inhaltsmodule übersetzen.",
      suggestedModule: "AI Visibility Check",
      suggestedService: "AI Visibility Sprint",
      implementationEffort: "medium",
      expectedEffect: "Bessere Auffindbarkeit und klarere Antworten für kaufnahe Suchsituationen.",
      recurringPotential: true,
      ctaLabel: "Roadmap freischalten",
      ctaHref: "/preise",
      sourceType: "fallback",
      priorityScore: 52,
    },
  ];
}

function dedupe(candidates: SourceCandidate[]): SourceCandidate[] {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${normalizeKey(candidate.category)}:${normalizeKey(candidate.title)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildAnalysisOpportunities(input: OpportunityInput): AnalysisOpportunity[] {
  const safeInput = input ?? {};
  const candidates = dedupe([
    ...revenueBlockerCandidates(safeInput.revenueBlockers),
    ...measureCandidates(safeInput.measures),
    ...findingCandidates(safeInput.findings),
    ...aiSuggestionCandidates(safeInput.aiSuggestions),
  ]);

  const source = candidates.length > 0 ? candidates : fallbackCandidates(safeInput.overallScore, safeInput.url);

  return source
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, MAX_OPPORTUNITIES)
    .map(createOpportunity);
}
