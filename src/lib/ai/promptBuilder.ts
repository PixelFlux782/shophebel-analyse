import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";

export type PremiumPromptMessage = {
  role: "system" | "user";
  content: string;
};

export type PremiumPromptBuildResult = {
  messages: PremiumPromptMessage[];
  inputSummary: {
    url: string;
    overallScore: number;
    scoresCount: number;
    criticalSignalsCount: number;
    revenueBlockersCount: number;
    measuresCount: number;
    opportunitiesCount: number;
  };
};

type PromptPayload = {
  analysis: {
    url: string;
    requestedUrl?: string;
    finalUrl?: string;
    analyzedAt?: string;
    analysisMode: PremiumReportInput["analysisMode"];
    overallScore: number;
    totalFindings: number;
    visibleFindings: number;
  };
  scores: PremiumReportInput["scores"];
  criticalSignals: PremiumReportInput["criticalSignals"];
  revenueBlockers: PremiumReportInput["revenueBlockers"];
  measures: PremiumReportInput["measures"];
  opportunities: PremiumReportInput["opportunities"];
  detectedPageSignals?: PremiumReportInput["detectedPageSignals"];
  websiteAnalysis?: PremiumReportInput["websiteAnalysis"];
  technicalNotes: string[];
  constraints: PremiumReportInput["constraints"] & {
    noFreeWebsiteReview: true;
    noRevenueGuarantees: true;
    noClaimsOutsideInput: true;
  };
  requiredOutput: {
    format: "json";
    schema: Record<string, unknown>;
  };
};

const MAX_PROMPT_TEXT_LENGTH = 360;
const MAX_EVIDENCE_ITEMS = 3;
const MAX_SCORES = 8;
const MAX_CRITICAL_SIGNALS = 8;
const MAX_REVENUE_BLOCKERS = 5;
const MAX_MEASURES = 7;
const MAX_OPPORTUNITIES = 5;
const MAX_SIGNAL_ITEMS = 6;
const MAX_WEBSITE_PAGES = 5;
const FORBIDDEN_PROMPT_TERMS = [
  /html/gi,
  /screenshotUrl/gi,
  /payment/gi,
  /metadata/gi,
  /contactRequestId/gi,
];

const SYSTEM_PROMPT = [
  "Du bist ein erfahrener E-Commerce- und Conversion-Berater.",
  "Du erstellst eine kompakte Premium-Beratung fuer Shophebel.",
  "Sprache: Deutsch.",
  "Zielgruppe: Shop-Betreiber ohne technisches Spezialwissen.",
  "Ton: ruhig, beratend, klar, hochwertig, konkret, wie ein erfahrener Shop-Berater nach einer echten Durchsicht.",
  "Die bestehende Shophebel-Analyse ist die einzige Faktenbasis.",
  "Erklaere dem Shopbetreiber, welche 3 Dinge den Shop aktuell am staerksten bremsen und was er in den naechsten 7 Tagen konkret tun sollte.",
  "Wenn websiteAnalysis im Input enthalten ist, bewerte die Website als Gesamtsystem statt als Stapel einzelner Seiten.",
  "Pruefe dann: Angebot schnell verstaendlich, Vertrauen ueber Seiten hinweg, Navigation/CTA, Kontakt- oder Kaufweg und fehlende Seitentypen.",
  "Wenn eine Seitentype fehlt, benenne sie als Luecke. Erfinde keine Unterseite.",
  "Bewerte keine Webseite frei und fuehre keine eigene Recherche durch.",
  "Erfinde keine Fakten, Kennzahlen, Beobachtungen, Ursachen oder Belege.",
  "Behaupte nichts ueber Dinge, die nicht im Input stehen.",
  "Gib keine Garantien fuer Umsatzsteigerung oder wirtschaftliche Ergebnisse.",
  "Schreibe konkret am analysierten Shop: nutze URL, Score, Subscores, Umsatzbremsen, Visual Audit, Screenshotbefunde, Opportunities und vorhandene Premium-Analyse, falls im Input vorhanden.",
  "Vermeide generische Saetze wie \"Optimieren Sie Ihre Website\" oder \"Verbessern Sie die Benutzererfahrung\".",
  "Nutze keine leeren Begriffe wie \"User Experience verbessern\", wenn du nicht direkt erklaerst, was genau im Shop passieren soll.",
  "Vermeide Wiederholungen, lange Textwaende, Marketing-Sprache und Formulierungen wie aus einem Chatbot.",
  "Nutze keine Fachbegriffe ohne kurze Einordnung in Alltagssprache.",
  "Nutze keine Screenshots, Rohdaten, Markup, Zahlungsdaten oder interne Zusatzdaten.",
  "Deine Aufgabe: Hauptproblem einordnen, vorhandene Staerken nennen, Bremsen priorisieren, drei Hebel beraten und einen praktischen 7-Tage-Fahrplan ableiten.",
  "Antworte ausschliesslich als valides JSON im geforderten Schema.",
].join("\n");

function limitText(value: unknown, maxLength = MAX_PROMPT_TEXT_LENGTH): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const redacted = FORBIDDEN_PROMPT_TERMS.reduce(
    (text, term) => text.replace(term, "[entfernt]"),
    value.replace(/\s+/g, " ").trim(),
  );

  if (!redacted) {
    return undefined;
  }

  if (redacted.length <= maxLength) {
    return redacted;
  }

  return `${redacted.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function limitNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

function limitList<T>(items: readonly T[] | undefined, maxItems: number): T[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.slice(0, maxItems);
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    }),
  ) as T;
}

function mapEvidence(evidence: string[] | undefined): string[] | undefined {
  const values = limitList(evidence, MAX_EVIDENCE_ITEMS)
    .map((item) => limitText(item, 220))
    .filter((item): item is string => Boolean(item));

  return values.length > 0 ? values : undefined;
}

function mapScores(scores: PremiumReportInput["scores"]): PremiumReportInput["scores"] {
  return limitList(scores, MAX_SCORES).map((score) =>
    compactObject({
      category: limitText(score.category, 80) ?? "Kategorie",
      score: limitNumber(score.score),
      label: limitText(score.label, 100) ?? "Bewertung",
      summary: limitText(score.summary),
      evidence: mapEvidence(score.evidence),
    }),
  );
}

function mapCriticalSignals(signals: PremiumReportInput["criticalSignals"]): PremiumReportInput["criticalSignals"] {
  return limitList(signals, MAX_CRITICAL_SIGNALS).map((signal) =>
    compactObject({
      title: limitText(signal.title, 140) ?? "Analyse-Signal",
      severity: signal.severity,
      category: limitText(signal.category, 80),
      evidence: mapEvidence(signal.evidence),
    }),
  );
}

function mapRevenueBlockers(blockers: PremiumReportInput["revenueBlockers"]): PremiumReportInput["revenueBlockers"] {
  return limitList(blockers, MAX_REVENUE_BLOCKERS).map((blocker) =>
    compactObject({
      title: limitText(blocker.title, 160) ?? "Umsatzbremse",
      description: limitText(blocker.description) ?? "",
      action: limitText(blocker.action) ?? "",
      impact: limitText(blocker.impact, 80),
      effort: limitText(blocker.effort, 80),
      category: limitText(blocker.category, 80),
      priority: blocker.priority,
      severity: blocker.severity,
      evidence: mapEvidence(blocker.evidence),
    }),
  );
}

function mapMeasures(measures: PremiumReportInput["measures"]): PremiumReportInput["measures"] {
  return limitList(measures, MAX_MEASURES).map((measure) =>
    compactObject({
      title: limitText(measure.title, 160) ?? "Massnahme",
      description: limitText(measure.description) ?? "",
      effort: limitText(measure.effort, 80),
      impact: limitText(measure.impact, 80),
      priority: measure.priority,
      category: limitText(measure.category, 80),
      source: limitText(measure.source, 160),
    }),
  );
}

function mapOpportunities(opportunities: PremiumReportInput["opportunities"]): PremiumReportInput["opportunities"] {
  return limitList(opportunities, MAX_OPPORTUNITIES).map((opportunity) =>
    compactObject({
      title: limitText(opportunity.title, 160) ?? "Opportunity",
      description: limitText(opportunity.description) ?? "",
      category: limitText(opportunity.category, 80),
      severity: opportunity.severity,
      impact: limitText(opportunity.impact, 120),
      effort: limitText(opportunity.effort, 80),
      expectedEffect: limitText(opportunity.expectedEffect, 160),
      source: opportunity.source,
      priorityScore: opportunity.priorityScore,
    }),
  );
}

function mapSignals(signals: PremiumReportInput["detectedPageSignals"]): PremiumReportInput["detectedPageSignals"] | undefined {
  if (!signals) {
    return undefined;
  }

  const mapped = compactObject({
    heroText: limitList(signals.heroText, MAX_SIGNAL_ITEMS)
      .map((item) => limitText(item, 140))
      .filter((item): item is string => Boolean(item)),
    ctaTexts: limitList(signals.ctaTexts, MAX_SIGNAL_ITEMS)
      .map((item) => limitText(item, 100))
      .filter((item): item is string => Boolean(item)),
    trustSignals: limitList(signals.trustSignals, MAX_SIGNAL_ITEMS)
      .map((item) => limitText(item, 100))
      .filter((item): item is string => Boolean(item)),
    technicalNotes: limitList(signals.technicalNotes, MAX_SIGNAL_ITEMS)
      .map((item) => limitText(item, 180))
      .filter((item): item is string => Boolean(item)),
  });

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function mapWebsiteAnalysis(websiteAnalysis: PremiumReportInput["websiteAnalysis"]): PremiumReportInput["websiteAnalysis"] | undefined {
  if (!websiteAnalysis) {
    return undefined;
  }

  return compactObject({
    overallWebsiteScore: limitNumber(websiteAnalysis.overallWebsiteScore),
    crossPageDiagnosis: limitText(websiteAnalysis.crossPageDiagnosis) ?? "",
    repeatedProblems: limitList(websiteAnalysis.repeatedProblems, 5)
      .map((item) => limitText(item, 180))
      .filter((item): item is string => Boolean(item)),
    strongestPage: websiteAnalysis.strongestPage
      ? compactObject({
          label: limitText(websiteAnalysis.strongestPage.label, 80) ?? "Stärkste Seite",
          score: limitNumber(websiteAnalysis.strongestPage.score),
        })
      : undefined,
    weakestPage: websiteAnalysis.weakestPage
      ? compactObject({
          label: limitText(websiteAnalysis.weakestPage.label, 80) ?? "Schwächste Seite",
          score: limitNumber(websiteAnalysis.weakestPage.score),
        })
      : undefined,
    conversionPathAssessment: limitText(websiteAnalysis.conversionPathAssessment) ?? "",
    trustConsistencyAssessment: limitText(websiteAnalysis.trustConsistencyAssessment) ?? "",
    navigationAssessment: limitText(websiteAnalysis.navigationAssessment) ?? "",
    topPrioritiesWebsiteWide: limitList(websiteAnalysis.topPrioritiesWebsiteWide, 5)
      .map((item) => limitText(item, 180))
      .filter((item): item is string => Boolean(item)),
    missingPageTypes: limitList(websiteAnalysis.missingPageTypes, 5)
      .map((item) => limitText(item, 40))
      .filter((item): item is string => Boolean(item)),
    pages: limitList(websiteAnalysis.pages, MAX_WEBSITE_PAGES).map((page) =>
      compactObject({
        label: limitText(page.label, 90) ?? "Seite",
        role: limitText(page.role, 40) ?? "unknown",
        score: typeof page.score === "number" ? limitNumber(page.score) : undefined,
        analysisStatus: page.analysisStatus,
        mainProblem: limitText(page.mainProblem, 180),
        recommendation: limitText(page.recommendation, 220) ?? "",
        shortDiagnosis: limitText(page.shortDiagnosis, 220) ?? "",
      }),
    ),
  });
}

function buildRequiredOutputSchema() {
  return {
    executiveSummary: "string",
    mainDiagnosis: "string",
    websiteSystem: {
      overallWebsiteScore: "number aus Input oder 0",
      crossPageDiagnosis: "string",
      repeatedProblems: ["string"],
      conversionPathAssessment: "string",
      trustConsistencyAssessment: "string",
      navigationAssessment: "string",
      topPrioritiesWebsiteWide: ["string"],
      missingPageTypes: ["string"],
    },
    topLevers: [
      {
        title: "string",
        whyItMatters: "string",
        shopObservation: "string",
        improvement: "string",
        firstStep: "string",
        difficulty: "leicht | mittel | anspruchsvoll",
        expectedEffect: "string ohne Zahlenversprechen",
      },
    ],
    sevenDayPlan: [
      {
        day: "Tag 1-2 | Tag 3-5 | Tag 6-7",
        focus: "string",
        tasks: ["string"],
      },
    ],
    ownerConclusion: "string",
  };
}

function buildPayload(input: PremiumReportInput): PromptPayload {
  const detectedPageSignals = mapSignals(input.detectedPageSignals);
  const websiteAnalysis = mapWebsiteAnalysis(input.websiteAnalysis);

  return compactObject({
    analysis: compactObject({
      url: limitText(input.url, 240) ?? "",
      requestedUrl: limitText(input.requestedUrl, 240),
      finalUrl: limitText(input.finalUrl, 240),
      analyzedAt: limitText(input.analyzedAt, 80),
      analysisMode: input.analysisMode,
      overallScore: limitNumber(input.overallScore),
      totalFindings: Math.max(0, limitNumber(input.totalFindings)),
      visibleFindings: Math.max(0, limitNumber(input.visibleFindings)),
    }),
    scores: mapScores(input.scores),
    criticalSignals: mapCriticalSignals(input.criticalSignals),
    revenueBlockers: mapRevenueBlockers(input.revenueBlockers),
    measures: mapMeasures(input.measures),
    opportunities: mapOpportunities(input.opportunities),
    detectedPageSignals,
    websiteAnalysis,
    technicalNotes: detectedPageSignals?.technicalNotes ?? [],
    constraints: {
      ...input.constraints,
      noFreeWebsiteReview: true,
      noRevenueGuarantees: true,
      noClaimsOutsideInput: true,
    },
    requiredOutput: {
      format: "json",
      schema: buildRequiredOutputSchema(),
    },
  });
}

function buildUserPrompt(input: PremiumReportInput): string {
  const payload = buildPayload(input);

  return [
    "Erstelle aus dieser Shophebel-Analyse die Premium-KI-Beratung.",
    "Pflichtstruktur:",
    "- executiveSummary: Management-Fazit in 3-5 kurzen Saetzen. Konkret sagen, was der Shop schon gut macht und was ihn bremst.",
    "- mainDiagnosis: zentrale Diagnose im Muster: Das eigentliche Problem ist nicht X, sondern Y. Es muss nach echter Einordnung klingen.",
    "- websiteSystem: Gesamtberatung ueber alle analysierten Seiten. Nutze overallWebsiteScore nur aus dem Input. Benenne wiederkehrende Probleme, Conversion-Pfad, Vertrauen, Navigation, Website-weite Prioritaeten und fehlende Seitentypen.",
    "- topLevers: exakt 3 Hebel. Jeder Hebel braucht Titel, warum das wichtig ist, was im Shop vermutlich passiert, konkrete Verbesserung, erster kleiner Schritt, Schwierigkeit und qualitativen Effekt ohne Zahlenversprechen.",
    "- sevenDayPlan: exakt diese Phasen: Tag 1-2, Tag 3-5, Tag 6-7. Tag 1-2 klaert Texte und wichtigste Handlung. Tag 3-5 setzt Startseite, Produktseite, Vertrauen und Navigation um. Tag 6-7 kontrolliert, vergleicht und leitet die naechste Optimierung ab.",
    "- ownerConclusion: ehrliches Fazit fuer den Inhaber: ruhig, klar, motivierend, nicht werblich.",
    "Anti-Generic-Regeln:",
    "- Schreibe nie nur \"Optimieren Sie Ihre Website\".",
    "- Schreibe nie nur \"Benutzererfahrung verbessern\".",
    "- Keine erfundenen Zahlen, keine Garantien, keine Umsatzversprechen.",
    "- Bei Mehrseiten-Daten keine fuenf Einzelreports schreiben, sondern die groessten Muster ueber die Website hinweg beraten.",
    "- Keine Wiederholungen und keine langen Textwaende.",
    "Nutze nur die folgenden strukturierten Analyse-Fakten und gib ausschliesslich JSON zurueck.",
    JSON.stringify(payload, null, 2),
  ].join("\n\n");
}

export function buildPremiumReportPrompt(input: PremiumReportInput): PremiumPromptBuildResult {
  return {
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
    inputSummary: {
      url: input.url,
      overallScore: limitNumber(input.overallScore),
      scoresCount: input.scores.length,
      criticalSignalsCount: input.criticalSignals.length,
      revenueBlockersCount: input.revenueBlockers.length,
      measuresCount: input.measures.length,
      opportunitiesCount: input.opportunities.length,
    },
  };
}
