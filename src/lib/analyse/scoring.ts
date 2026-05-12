import {
  AnalysisCategory,
  AnalysisResult,
  AnalysisResultCategories,
  CategoryScore,
  Finding,
  Recommendation,
} from "@/types/analysis";
import { FREE_VISIBLE_FINDINGS_LIMIT } from "@/lib/result-ui";

const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  seo: "Auffindbarkeit",
  performance: "Ladegefuehl",
  trust: "Vertrauen",
  conversion: "Anfragen",
  design: "Design",
  aiVisibility: "KI-Sichtbarkeit",
  ux: "Nutzerfuehrung",
};

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function createCategoryScore(category: AnalysisCategory, score: number): CategoryScore {
  return {
    category,
    label: CATEGORY_LABELS[category],
    score: clampScore(score),
  };
}

export function calculateOverallScore(categoryScores: Partial<Record<AnalysisCategory, CategoryScore>>) {
  const scores = Object.values(categoryScores).map((entry) => entry.score);
  if (scores.length === 0) {
    return 0;
  }
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return clampScore(average);
}

interface BuildAnalysisResultInput {
  requestedUrl: string;
  finalUrl: string;
  analysisMode: AnalysisResult["analysisMode"];
  technicalNotes?: string[];
  screenshots?: AnalysisResult["screenshots"];
  visualMap?: AnalysisResult["visualMap"];
  categoryScores: Partial<Record<AnalysisCategory, CategoryScore>>;
  categories?: AnalysisResultCategories;
  quickWins?: Recommendation[];
  criticalIssues?: Recommendation[];
  premiumInsightsPreview?: Recommendation[];
  revenueBlockers?: AnalysisResult["revenueBlockers"];
  measures?: AnalysisResult["measures"];
  findings: Finding[];
  recommendations: Recommendation[];
  aiSuggestions?: AnalysisResult["aiSuggestions"];
}

export function buildAnalysisResult(input: BuildAnalysisResultInput): AnalysisResult {
  const createdAt = new Date().toISOString();
  const screenshots =
    input.screenshots?.viewport ||
    input.screenshots?.fullPage ||
    input.screenshots?.mobile ||
    input.screenshots?.hero
      ? input.screenshots
      : undefined;
  const categories =
    input.categories ??
    ({
      seo: {
        score: input.categoryScores.seo?.score ?? 0,
        label: "Auffindbarkeit",
        summary: "Auffindbarkeit wurde im bisherigen Scoring bewertet.",
        checks: [],
      },
      performance: {
        score: input.categoryScores.performance?.score ?? 0,
        label: "Ladegefuehl",
        summary: "Performance wurde in diesem Legacy-Aufruf nicht geprüft.",
        checks: [],
      },
      trust: {
        score: input.categoryScores.trust?.score ?? 0,
        label: "Vertrauen",
        summary: "Vertrauen wurde im bisherigen Scoring bewertet.",
        checks: [],
      },
      conversion: {
        score: input.categoryScores.conversion?.score ?? 0,
        label: "Anfragen",
        summary: "Der Weg zu Anfrage oder Kauf wurde im bisherigen Scoring bewertet.",
        checks: [],
      },
      design: {
        score: input.categoryScores.design?.score ?? input.categoryScores.ux?.score ?? 0,
        label: "Design",
        summary: "Design wurde in diesem Legacy-Aufruf aus UX-Signalen abgeleitet.",
        checks: [],
      },
      aiVisibility: {
        score: input.categoryScores.aiVisibility?.score ?? 0,
        label: "KI-Sichtbarkeit",
        summary: "KI-Sichtbarkeit wurde in diesem Legacy-Aufruf nicht geprüft.",
        checks: [],
      },
    } satisfies AnalysisResultCategories);

  return {
    url: input.finalUrl,
    createdAt,
    requestedUrl: input.requestedUrl,
    scannedAt: createdAt,
    analysisMode: input.analysisMode,
    finalUrl: input.finalUrl,
    technicalNotes: input.technicalNotes ?? [],
    screenshots,
    visualPreviewAvailable: Boolean(
      screenshots?.viewport || screenshots?.fullPage || screenshots?.mobile || screenshots?.hero,
    ),
    visualMap: input.visualMap,
    isPremium: false,
    totalFindings: input.findings.length,
    visibleFindings: Math.min(FREE_VISIBLE_FINDINGS_LIMIT, input.findings.length),
    overallScore: calculateOverallScore(input.categoryScores),
    categories,
    quickWins: input.quickWins ?? [],
    criticalIssues: input.criticalIssues ?? [],
    premiumInsightsPreview: input.premiumInsightsPreview ?? [],
    revenueBlockers: input.revenueBlockers ?? [],
    measures: input.measures ?? [],
    categoryScores: input.categoryScores,
    findings: input.findings,
    recommendations: input.recommendations,
    aiSuggestions: input.aiSuggestions ?? [],
  };
}
