import {
  ActionMeasure,
  AnalysisCategory,
  AnalysisResult,
  Finding,
  PriorityLevel,
  Recommendation,
  RevenueBlocker,
} from "@/types/analysis";
import {
  ensureGermanSentence,
  normalizeGermanText,
  polishPremiumText,
  sentenceFragment,
} from "@/lib/premium/premiumCopy";

export type PremiumBlocker = {
  title: string;
  category: string;
  severity: "kritisch" | "wichtig" | "chance";
  whyItMatters: string;
  likelyBusinessImpact: string;
  recommendedFix: string;
  effort: "niedrig" | "mittel" | "hoch";
  priority: number;
};

export type PremiumReport = {
  isPaid: boolean;
  premiumSummary: {
    headline: string;
    mainReason: string;
    firstFocus: string;
    businessRelevance: string;
    fastestWin: string;
  };
  topRevenueBlockers: PremiumBlocker[];
  priorityRoadmap: string[];
  quickImplementationPlan: Array<{
    days: string;
    focus: string;
    actions: string[];
  }>;
  visualAuditNotes: Array<{
    area: string;
    note: string;
  }>;
  conversionHypothesis: string;
};

const CATEGORY_WEIGHT: Record<AnalysisCategory, number> = {
  conversion: 0,
  trust: 1,
  design: 2,
  ux: 3,
  performance: 4,
  aiVisibility: 5,
  seo: 6,
};

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function findingSeverity(finding: Finding): PremiumBlocker["severity"] {
  if (finding.status === "error" || finding.priority === "high") {
    return "kritisch";
  }

  if (finding.status === "warning" || finding.priority === "medium") {
    return "wichtig";
  }

  return "chance";
}

function effortFromPriority(priority: PriorityLevel): PremiumBlocker["effort"] {
  if (priority === "high") {
    return "mittel";
  }

  if (priority === "medium") {
    return "niedrig";
  }

  return "niedrig";
}

function categoryLabel(category: AnalysisCategory) {
  const labels: Record<AnalysisCategory, string> = {
    conversion: "Conversion",
    trust: "Vertrauen",
    design: "Design",
    ux: "Mobile UX",
    performance: "Ladegefühl",
    aiVisibility: "AI-Sichtbarkeit",
    seo: "SEO",
  };

  return labels[category];
}

function impactText(category: string) {
  if (/(Conversion|Button|CTA|Klarheit)/i.test(category)) {
    return "Besucher verstehen den nächsten Schritt nicht schnell genug und brechen eher ab.";
  }

  if (/Vertrauen/i.test(category)) {
    return "Fehlende Sicherheit oder Proof senkt die Bereitschaft, Kontakt aufzunehmen oder zu kaufen.";
  }

  if (/(Design|Mobile|UX)/i.test(category)) {
    return "Die Seite wirkt weniger führend und erzeugt Reibung, besonders auf mobilen Geräten.";
  }

  return "Der Hebel kann Reichweite, Verständnis oder Abschlusswahrscheinlichkeit indirekt bremsen.";
}

function fromRevenueBlocker(blocker: RevenueBlocker): PremiumBlocker {
  return {
    title: sentenceFragment(blocker.problem, "Umsatzbremse im Kaufprozess"),
    category: polishPremiumText(blocker.category),
    severity: blocker.estimatedImpact === "hoch" ? "kritisch" : "wichtig",
    whyItMatters: ensureGermanSentence(blocker.whyItCostsCustomers),
    likelyBusinessImpact: impactText(blocker.category),
    recommendedFix: ensureGermanSentence(blocker.action, "Diesen Punkt sichtbar und verständlich verbessern."),
    effort: blocker.estimatedEffort,
    priority: blocker.priority,
  };
}

function fromFinding(finding: Finding, priority: number): PremiumBlocker {
  const category = categoryLabel(finding.category);

  return {
    title: sentenceFragment(finding.title, "Optimierungshebel"),
    category,
    severity: findingSeverity(finding),
    whyItMatters: ensureGermanSentence(finding.description),
    likelyBusinessImpact: impactText(category),
    recommendedFix: buildRecommendedFix(category, finding.description),
    effort: effortFromPriority(finding.priority),
    priority,
  };
}

function buildRecommendedFix(category: string, description: string) {
  const cleanDescription = sentenceFragment(description, "den erkannten Reibungspunkt beheben");

  if (/(Conversion|Button|CTA|Klarheit)/i.test(category)) {
    return "Den nächsten Schritt im sichtbaren Startbereich klar benennen und den wichtigsten Button früher sichtbar machen.";
  }

  if (/Vertrauen/i.test(category)) {
    return "Vertrauenssignale wie Bewertungen, Referenzen oder Kontaktwege vor der Entscheidung sichtbarer platzieren.";
  }

  if (/(Mobile|Design|UX|Lade)/i.test(category)) {
    return "Layout, Lesbarkeit und Bildführung so vereinfachen, dass die Seite mobil schneller erfassbar wird.";
  }

  return ensureGermanSentence(`Den erkannten Punkt priorisiert verbessern: ${cleanDescription}`);
}

function sortFindingsForPremium(findings: Finding[]) {
  return [...findings].sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const categoryDiff = CATEGORY_WEIGHT[a.category] - CATEGORY_WEIGHT[b.category];
    if (categoryDiff !== 0) return categoryDiff;

    const statusWeight = (finding: Finding) => finding.status === "error" ? 0 : finding.status === "warning" ? 1 : 2;
    return statusWeight(a) - statusWeight(b);
  });
}

function buildTopRevenueBlockers(result: AnalysisResult) {
  const revenueBlockers = result.revenueBlockers.map(fromRevenueBlocker);
  const findingBlockers = sortFindingsForPremium(result.findings)
    .map((finding, index) => fromFinding(finding, index + 1));
  const seen = new Set<string>();

  return [...revenueBlockers, ...findingBlockers]
    .filter((blocker) => {
      const key = blocker.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
    .map((blocker, index) => ({ ...blocker, priority: index + 1 }));
}

function firstByImpact(items: Recommendation[]) {
  return items.find((item) => item.impact === "high") ?? items[0];
}

function buildPremiumSummary(result: AnalysisResult, blockers: PremiumBlocker[]) {
  const lowestCategory = Object.values(result.categories)
    .sort((a, b) => a.score - b.score)[0];
  const firstBlocker = blockers[0];
  const fastestWin = firstByImpact(result.quickWins) ?? firstByImpact(result.recommendations);

  return {
    headline: "Premium Anfrage- und Vertrauens-Audit",
    mainReason: firstBlocker
      ? ensureGermanSentence(`Der wahrscheinlich größte Bremsfaktor ist: ${sentenceFragment(firstBlocker.title)}`)
      : ensureGermanSentence(`Die Seite hat mit ${sentenceFragment(lowestCategory?.label, "Klarheit und Vertrauen")} den wichtigsten Optimierungsbereich`),
    firstFocus: firstBlocker
      ? `Starte mit ${firstBlocker.category}, weil dieser Punkt direkt auf Anfrage- und Kaufbereitschaft wirkt.`
      : "Starte mit klarerem Hero, sichtbarerem Button und mehr Vertrauenssignalen.",
    businessRelevance: "Jede reduzierte Reibung im sichtbaren Startbereich, bei Vertrauen und beim nächsten Schritt kann mehr qualifizierte Anfragen aus bestehendem Traffic holen.",
    fastestWin: fastestWin
      ? sentenceFragment(fastestWin.title)
      : "Hero-Botschaft, sichtbaren Button und Vertrauenselemente zuerst schärfen.",
  };
}

function measureToAction(measure?: ActionMeasure) {
  return measure
    ? ensureGermanSentence(measure.title)
    : "Konkrete Anpassung aus den priorisierten Findings umsetzen.";
}

function buildQuickImplementationPlan(result: AnalysisResult, blockers: PremiumBlocker[]) {
  return [
    {
      days: "Tag 1-2",
      focus: "Hero, Button und Klarheit",
      actions: [
        blockers.find((item) => /(Conversion|Button|CTA|Klarheit)/i.test(item.category))?.recommendedFix ?? measureToAction(result.measures[0]),
        "Hauptversprechen, Zielgruppe und nächsten Schritt im sichtbaren Startbereich klarer machen.",
      ],
    },
    {
      days: "Tag 3-4",
      focus: "Vertrauen, Proof und rechtliche Sicherheit",
      actions: [
        blockers.find((item) => /Vertrauen/i.test(item.category))?.recommendedFix ?? measureToAction(result.measures[1]),
        "Bewertungen, Referenzen, Zahlungs-/Kontaktvertrauen und Pflichtseiten sichtbarer platzieren.",
      ],
    },
    {
      days: "Tag 5-6",
      focus: "Mobile UX, Bilder und Struktur",
      actions: [
        blockers.find((item) => /(Mobile|Design|UX|Lade)/i.test(item.category))?.recommendedFix ?? measureToAction(result.measures[2]),
        "Mobile Ansicht, Bildwirkung und Abschnittsreihenfolge auf schnelle Orientierung trimmen.",
      ],
    },
    {
      days: "Tag 7",
      focus: "Kontrolle und Nachmessung",
      actions: [
        "Analyse erneut ausführen und Score, Button-Sichtbarkeit sowie neue Reibungspunkte vergleichen.",
        "Die nächsten zwei Maßnahmen nach Wirkung und Aufwand priorisieren.",
      ],
    },
  ];
}

function buildVisualAuditNotes(result: AnalysisResult) {
  if (!result.screenshots?.viewport && !result.screenshots?.fullPage && !result.screenshots?.mobile) {
    return [{
      area: "Visuelle Vorschau",
      note: "Für diese Analyse war keine visuelle Vorschau verfügbar. Der Premium-Report nutzt deshalb Struktur, Inhalte, Checks und erkannte Signale.",
    }];
  }

  return [
    {
      area: "Sichtbarer Startbereich",
      note: "Prüfe zuerst, ob Nutzenversprechen, Zielgruppe und nächster Schritt ohne Scrollen klar erkennbar sind.",
    },
    {
      area: "Button-Sichtbarkeit",
      note: "Die wichtigste Handlungsaufforderung sollte visuell auffallen und nach den ersten Nutzenargumenten wiederholt werden.",
    },
    {
      area: "Trust-Bereich",
      note: "Bewertungen, Garantien, Kontaktwege und rechtliche Sicherheit sollten sichtbar vor kritischen Entscheidungen auftauchen.",
    },
    {
      area: "Mobile Eindruck",
      note: result.screenshots.mobile
        ? "Die mobile Vorschau sollte auf Lesbarkeit, Button-Größe und schnelle Orientierung geprüft werden."
        : "Es gab keine mobile Vorschau; mobile Darstellung sollte manuell gegengeprüft werden.",
    },
    {
      area: "Visuelle Führung",
      note: "Überschriften, Bilder und Abstände sollten den Blick zum nächsten sinnvollen Schritt führen.",
    },
  ];
}

function buildPriorityRoadmap(blockers: PremiumBlocker[], result: AnalysisResult) {
  const blockerActions = blockers.map((blocker) => `${blocker.priority}. ${blocker.recommendedFix}`);
  const measureActions = result.measures.slice(0, 5).map((measure) => `${measure.priority}. ${ensureGermanSentence(measure.title)}`);

  return (blockerActions.length > 0 ? blockerActions : measureActions).slice(0, 5);
}

function normalizePremiumBlocker(blocker: PremiumBlocker): PremiumBlocker {
  return {
    ...blocker,
    title: sentenceFragment(blocker.title),
    category: normalizeGermanText(blocker.category),
    whyItMatters: ensureGermanSentence(blocker.whyItMatters),
    likelyBusinessImpact: ensureGermanSentence(blocker.likelyBusinessImpact),
    recommendedFix: ensureGermanSentence(blocker.recommendedFix),
  };
}

function normalizePremiumReport(report: PremiumReport): PremiumReport {
  return {
    ...report,
    premiumSummary: {
      headline: normalizeGermanText(report.premiumSummary.headline),
      mainReason: ensureGermanSentence(report.premiumSummary.mainReason),
      firstFocus: ensureGermanSentence(report.premiumSummary.firstFocus),
      businessRelevance: ensureGermanSentence(report.premiumSummary.businessRelevance),
      fastestWin: sentenceFragment(report.premiumSummary.fastestWin),
    },
    topRevenueBlockers: report.topRevenueBlockers.map(normalizePremiumBlocker),
    priorityRoadmap: report.priorityRoadmap.map((item) => normalizeGermanText(item)),
    quickImplementationPlan: report.quickImplementationPlan.map((step) => ({
      days: normalizeGermanText(step.days),
      focus: normalizeGermanText(step.focus),
      actions: step.actions.map((action) => ensureGermanSentence(action)),
    })),
    visualAuditNotes: report.visualAuditNotes.map((note) => ({
      area: normalizeGermanText(note.area),
      note: ensureGermanSentence(note.note),
    })),
    conversionHypothesis: ensureGermanSentence(report.conversionHypothesis),
  };
}

export function buildPremiumReport(input: {
  analysis: AnalysisResult;
  paymentStatus?: string | null;
}): PremiumReport {
  const isPaid = input.paymentStatus === "paid";
  const topRevenueBlockers = buildTopRevenueBlockers(input.analysis);
  const premiumSummary = buildPremiumSummary(input.analysis, topRevenueBlockers);

  return normalizePremiumReport({
    isPaid,
    premiumSummary,
    topRevenueBlockers,
    priorityRoadmap: buildPriorityRoadmap(topRevenueBlockers, input.analysis),
    quickImplementationPlan: buildQuickImplementationPlan(input.analysis, topRevenueBlockers),
    visualAuditNotes: buildVisualAuditNotes(input.analysis),
    conversionHypothesis: buildConversionHypothesis(topRevenueBlockers[0]),
  });
}

function conversionCondition(blocker?: PremiumBlocker) {
  const text = `${blocker?.category ?? ""} ${blocker?.title ?? ""}`.toLowerCase();

  if (/(conversion|button|cta|handlungsaufforderung|hero|schritt|klarheit)/i.test(text)) {
    return "der nächste Schritt auf der Seite klarer sichtbar wird";
  }

  if (/vertrauen|trust|proof|bewertung|referenz|sicherheit/i.test(text)) {
    return "wichtige Vertrauenssignale früher sichtbar werden";
  }

  if (/mobile|ux|design|struktur|bild|führung|layout/i.test(text)) {
    return "Inhalte, Buttons und Reihenfolge leichter erfassbar werden";
  }

  if (/seo|reichweite|meta|title|snippet/i.test(text)) {
    return "Suchergebnis und Seiteninhalt besser zusammenpassen";
  }

  return "Klarheit, Vertrauen und der nächste Schritt sichtbarer werden";
}

function buildConversionHypothesis(blocker?: PremiumBlocker) {
  const condition = conversionCondition(blocker);

  return `Wenn ${condition}, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.`;
}
