import {
  ActionMeasure,
  AnalysisOpportunity,
  AnalysisResult,
  AuditCheckStatus,
  Finding,
  PriorityLevel,
  RevenueBlocker,
  ScoreBlock,
} from "@/types/analysis";
import type { PremiumWebsiteAnalysis } from "@/lib/premium/premiumWebsiteAnalysis";

export type PremiumReportSeverity = "low" | "medium" | "high" | "critical";

export type PremiumReportInput = {
  url: string;
  requestedUrl?: string;
  finalUrl?: string;
  analyzedAt?: string;
  analysisMode: AnalysisResult["analysisMode"];
  overallScore: number;
  totalFindings: number;
  visibleFindings: number;
  scores: Array<{
    category: string;
    score: number;
    label: string;
    summary?: string;
    evidence?: string[];
  }>;
  criticalSignals: Array<{
    title: string;
    severity: PremiumReportSeverity;
    category?: string;
    evidence?: string[];
  }>;
  revenueBlockers: Array<{
    title: string;
    description: string;
    action: string;
    impact?: string;
    effort?: string;
    category?: string;
    priority?: number;
    severity: PremiumReportSeverity;
    evidence?: string[];
  }>;
  measures: Array<{
    title: string;
    description: string;
    effort?: string;
    impact?: string;
    priority?: number;
    category?: string;
    source?: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    category?: string;
    severity?: PremiumReportSeverity;
    impact?: string;
    effort?: string;
    expectedEffect?: string;
    source?: AnalysisOpportunity["sourceType"];
    priorityScore?: number;
  }>;
  detectedPageSignals?: {
    heroText?: string[];
    ctaTexts?: string[];
    trustSignals?: string[];
    technicalNotes?: string[];
  };
  websiteAnalysis?: {
    overallWebsiteScore: number;
    crossPageDiagnosis: string;
    repeatedProblems: string[];
    strongestPage?: { label: string; score: number };
    weakestPage?: { label: string; score: number };
    conversionPathAssessment: string;
    trustConsistencyAssessment: string;
    navigationAssessment: string;
    topPrioritiesWebsiteWide: string[];
    missingPageTypes: string[];
    pages: Array<{
      label: string;
      role: string;
      score?: number;
      analysisStatus: "analyzed" | "failed";
      mainProblem?: string;
      recommendation: string;
      shortDiagnosis: string;
    }>;
  };
  constraints: {
    language: "de";
    audience: "shop-owner-non-technical";
    noInventedFacts: true;
    baseFactsOnlyOnAnalysis: true;
  };
};

const MAX_TEXT_LENGTH = 420;
const MAX_EVIDENCE_TEXT_LENGTH = 220;
const MAX_SCORES = 8;
const MAX_CRITICAL_SIGNALS = 10;
const MAX_REVENUE_BLOCKERS = 6;
const MAX_MEASURES = 8;
const MAX_OPPORTUNITIES = 6;
const MAX_SIGNAL_ITEMS = 8;
const MAX_WEBSITE_PAGES = 5;

export function limitText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

export function limitList<T>(items: readonly T[] | undefined, maxItems: number): T[] {
  if (!Array.isArray(items) || maxItems <= 0) {
    return [];
  }

  return items.slice(0, maxItems);
}

function cleanNumber(value: unknown, min = 0, max = 100): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.round(Math.max(min, Math.min(max, value)));
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

function uniqueStrings(values: Array<string | undefined>, maxItems: number, maxLength = MAX_EVIDENCE_TEXT_LENGTH) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const text = limitText(value, maxLength);
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(text);

    if (output.length >= maxItems) {
      break;
    }
  }

  return output;
}

export function compactEvidence(values: Array<string | undefined>, maxItems = 4): string[] | undefined {
  const evidence = uniqueStrings(values, maxItems);
  return evidence.length > 0 ? evidence : undefined;
}

export function normalizeSeverity(value: unknown): PremiumReportSeverity {
  if (value === "critical") {
    return "critical";
  }

  if (value === "high" || value === "hoch" || value === "error") {
    return "high";
  }

  if (value === "medium" || value === "mittel" || value === "warning") {
    return "medium";
  }

  return "low";
}

function severityFromCheck(status: AuditCheckStatus): PremiumReportSeverity {
  if (status === "critical") {
    return "critical";
  }

  if (status === "warning") {
    return "medium";
  }

  return "low";
}

function severityFromFinding(finding: Finding): PremiumReportSeverity {
  if (finding.status === "error") {
    return "critical";
  }

  return normalizeSeverity(finding.priority);
}

function priorityWeight(value: PriorityLevel) {
  return { high: 0, medium: 1, low: 2 }[value];
}

function getScoreBlocks(result: AnalysisResult): Array<[string, ScoreBlock]> {
  return Object.entries(result.categories) as Array<[string, ScoreBlock]>;
}

export function mapScoreBlocks(result: AnalysisResult): PremiumReportInput["scores"] {
  return limitList(getScoreBlocks(result), MAX_SCORES).map(([category, block]) => {
    const evidence = compactEvidence(
      block.checks
        .filter((check) => check.status === "critical" || check.status === "warning")
        .map((check) => `${check.title}: ${check.message}`),
    );

    return compactObject({
      category,
      score: cleanNumber(block.score) ?? 0,
      label: limitText(block.label, 80) ?? category,
      summary: limitText(block.summary),
      evidence,
    });
  });
}

export function mapCriticalSignals(result: AnalysisResult): PremiumReportInput["criticalSignals"] {
  const checkSignals = getScoreBlocks(result).flatMap(([category, block]) =>
    block.checks
      .filter((check) => check.status === "critical" || check.status === "warning")
      .map((check) => ({
        title: limitText(check.title, 140) ?? "Analyse-Signal",
        severity: severityFromCheck(check.status),
        category,
        evidence: compactEvidence([check.message], 1),
      })),
  );

  const findingSignals = result.findings
    .filter((finding) => finding.status !== "success")
    .sort((left, right) => priorityWeight(left.priority) - priorityWeight(right.priority))
    .map((finding) => ({
      title: limitText(finding.title, 140) ?? "Analyse-Finding",
      severity: severityFromFinding(finding),
      category: finding.category,
      evidence: compactEvidence([finding.description], 1),
    }));

  const seen = new Set<string>();

  return [...checkSignals, ...findingSignals]
    .filter((signal) => {
      const key = `${signal.category}:${signal.title}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const severityOrder: Record<PremiumReportSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      return severityOrder[left.severity] - severityOrder[right.severity];
    })
    .slice(0, MAX_CRITICAL_SIGNALS);
}

export function mapRevenueBlockers(blockers: RevenueBlocker[]): PremiumReportInput["revenueBlockers"] {
  return limitList(
    [...blockers].sort((left, right) => left.priority - right.priority),
    MAX_REVENUE_BLOCKERS,
  ).map((blocker) =>
    compactObject({
      title: limitText(blocker.problem, 160) ?? "Umsatzbremse",
      description: limitText(blocker.whyItCostsCustomers) ?? "",
      action: limitText(blocker.action) ?? "",
      impact: blocker.estimatedImpact,
      effort: blocker.estimatedEffort,
      category: blocker.category,
      priority: blocker.priority,
      severity: normalizeSeverity(blocker.estimatedImpact),
      evidence: compactEvidence([blocker.sourceCheck], 2),
    }),
  );
}

export function mapMeasures(measures: ActionMeasure[]): PremiumReportInput["measures"] {
  return limitList(
    [...measures].sort((left, right) => left.priority - right.priority),
    MAX_MEASURES,
  ).map((measure) =>
    compactObject({
      title: limitText(measure.title, 160) ?? "Massnahme",
      description: limitText(measure.description) ?? "",
      effort: measure.effort,
      impact: measure.impact,
      priority: measure.priority,
      category: measure.category,
      source: limitText(measure.sourceProblem, 160),
    }),
  );
}

export function mapOpportunities(opportunities: AnalysisOpportunity[] | undefined): PremiumReportInput["opportunities"] {
  return limitList(
    [...(opportunities ?? [])].sort((left, right) => right.priorityScore - left.priorityScore),
    MAX_OPPORTUNITIES,
  ).map((opportunity) =>
    compactObject({
      title: limitText(opportunity.title, 160) ?? "Opportunity",
      description: limitText(opportunity.description) ?? "",
      category: limitText(opportunity.category, 80),
      severity: normalizeSeverity(opportunity.severity),
      impact: limitText(opportunity.businessImpact),
      effort: opportunity.implementationEffort,
      expectedEffect: limitText(opportunity.expectedEffect),
      source: opportunity.sourceType,
      priorityScore: cleanNumber(opportunity.priorityScore),
    }),
  );
}

function buildDetectedPageSignals(result: AnalysisResult): PremiumReportInput["detectedPageSignals"] {
  const headings = uniqueStrings(
    result.visualMap?.headings.map((item) => item.label).filter(Boolean) ?? [],
    MAX_SIGNAL_ITEMS,
    120,
  );
  const buttons = uniqueStrings(
    result.visualMap?.buttons.map((item) => item.label).filter(Boolean) ?? [],
    MAX_SIGNAL_ITEMS,
    80,
  );
  const trustSignals = uniqueStrings(
    result.visualMap?.links
      .map((item) => item.label)
      .filter((label): label is string => typeof label === "string")
      .filter((label) => /impressum|datenschutz|kontakt|bewertung|referenz|agb|zahlung|versand|retoure/i.test(label)) ??
      [],
    MAX_SIGNAL_ITEMS,
    80,
  );
  const technicalNotes = uniqueStrings(result.technicalNotes ?? [], MAX_SIGNAL_ITEMS);

  const signals = compactObject({
    heroText: headings,
    ctaTexts: buttons,
    trustSignals,
    technicalNotes,
  });

  return Object.keys(signals).length > 0 ? signals : undefined;
}

function mapWebsiteAnalysis(websiteAnalysis?: PremiumWebsiteAnalysis): PremiumReportInput["websiteAnalysis"] {
  if (!websiteAnalysis) {
    return undefined;
  }

  return {
    overallWebsiteScore: cleanNumber(websiteAnalysis.overallWebsiteScore) ?? 0,
    crossPageDiagnosis: limitText(websiteAnalysis.crossPageDiagnosis) ?? "",
    repeatedProblems: limitList(websiteAnalysis.repeatedProblems, 5)
      .map((item) => limitText(item, 180))
      .filter((item): item is string => Boolean(item)),
    strongestPage: websiteAnalysis.strongestPage
      ? {
          label: limitText(websiteAnalysis.strongestPage.label, 80) ?? "Stärkste Seite",
          score: cleanNumber(websiteAnalysis.strongestPage.score) ?? 0,
        }
      : undefined,
    weakestPage: websiteAnalysis.weakestPage
      ? {
          label: limitText(websiteAnalysis.weakestPage.label, 80) ?? "Schwächste Seite",
          score: cleanNumber(websiteAnalysis.weakestPage.score) ?? 0,
        }
      : undefined,
    conversionPathAssessment: limitText(websiteAnalysis.conversionPathAssessment) ?? "",
    trustConsistencyAssessment: limitText(websiteAnalysis.trustConsistencyAssessment) ?? "",
    navigationAssessment: limitText(websiteAnalysis.navigationAssessment) ?? "",
    topPrioritiesWebsiteWide: limitList(websiteAnalysis.topPrioritiesWebsiteWide, 5)
      .map((item) => limitText(item, 180))
      .filter((item): item is string => Boolean(item)),
    missingPageTypes: websiteAnalysis.missingPageTypes,
    pages: limitList(websiteAnalysis.pages, MAX_WEBSITE_PAGES).map((page) =>
      compactObject({
        label: limitText(page.label, 90) ?? "Seite",
        role: page.role,
        score: cleanNumber(page.score),
        analysisStatus: page.analysisStatus,
        mainProblem: limitText(page.problems[0], 180),
        recommendation: limitText(page.recommendation, 220) ?? "",
        shortDiagnosis: limitText(page.shortDiagnosis, 220) ?? "",
      }),
    ),
  };
}

export function buildPremiumReportInput(
  result: AnalysisResult,
  options: { websiteAnalysis?: PremiumWebsiteAnalysis } = {},
): PremiumReportInput {
  const detectedPageSignals = buildDetectedPageSignals(result);
  const websiteAnalysis = mapWebsiteAnalysis(options.websiteAnalysis);

  return {
    url: result.url,
    requestedUrl: result.requestedUrl !== result.url ? limitText(result.requestedUrl, 240) : undefined,
    finalUrl: result.finalUrl && result.finalUrl !== result.url ? limitText(result.finalUrl, 240) : undefined,
    analyzedAt: result.scannedAt ?? result.createdAt,
    analysisMode: result.analysisMode,
    overallScore: cleanNumber(result.overallScore) ?? 0,
    totalFindings: Math.max(0, Math.round(result.totalFindings)),
    visibleFindings: Math.max(0, Math.round(result.visibleFindings)),
    scores: mapScoreBlocks(result),
    criticalSignals: mapCriticalSignals(result),
    revenueBlockers: mapRevenueBlockers(result.revenueBlockers),
    measures: mapMeasures(result.measures),
    opportunities: mapOpportunities(result.opportunities),
    ...(detectedPageSignals ? { detectedPageSignals } : {}),
    ...(websiteAnalysis ? { websiteAnalysis } : {}),
    constraints: {
      language: "de",
      audience: "shop-owner-non-technical",
      noInventedFacts: true,
      baseFactsOnlyOnAnalysis: true,
    },
  };
}
