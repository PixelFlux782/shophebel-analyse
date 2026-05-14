export type AnalysisCategory =
  | "seo"
  | "performance"
  | "trust"
  | "conversion"
  | "design"
  | "aiVisibility"
  | "ux";
export type FindingStatus = "success" | "warning" | "error";
export type AuditCheckStatus = "good" | "warning" | "critical" | "unknown" | "not_checked";
export type PriorityLevel = "low" | "medium" | "high";
export type AnalysisMode = "static" | "rendered";

export interface AnalysisRequest {
  url: string;
  mode?: string;
  isDemo?: boolean;
  isPremium?: boolean;
  contactRequestId?: string;
  auditContextId?: string;
  leadContext?: Record<string, unknown>;
  auditContext?: Record<string, unknown>;
}

export interface CategoryScore {
  category: AnalysisCategory;
  label: string;
  score: number;
}

export interface Finding {
  category: AnalysisCategory;
  status: FindingStatus;
  title: string;
  description: string;
  priority: PriorityLevel;
}

export interface PageRenderSignals {
  visibleButtons: number;
  visibleLinks: number;
  formFieldCount: number;
  visibleCtaTextMatches: number;
  imageCount: number;
  visibleTextLength: number;
  stickyHeaderDetected?: boolean;
}

export interface CheckContext {
  pageUrl: string;
  pageSignals?: PageRenderSignals;
}

export interface Recommendation {
  title: string;
  text: string;
  description: string;
  impact: PriorityLevel;
  effort: PriorityLevel;
  category?: AnalysisCategory;
  weight: number;
}

export interface RevenueBlocker {
  problem: string;
  whyItCostsCustomers: string;
  action: string;
  estimatedEffort: "niedrig" | "mittel" | "hoch";
  estimatedImpact: "niedrig" | "mittel" | "hoch";
  priority: 1 | 2 | 3 | 4 | 5;
  category: "Vertrauen" | "Klarheit" | "Mobile UX" | "CTA" | "Design" | "Ladegefuehl" | "AI-Sichtbarkeit";
  sourceCheck: string;
}

export interface ActionMeasure {
  title: string;
  description: string;
  effort: "niedrig" | "mittel" | "hoch";
  impact: "niedrig" | "mittel" | "hoch";
  priority: 1 | 2 | 3 | 4 | 5;
  category: "Vertrauen" | "Klarheit" | "Mobile UX" | "CTA" | "Design" | "Ladegefuehl" | "AI-Sichtbarkeit";
  sourceProblem: string;
}

export interface ScoreBlock {
  score: number;
  label: string;
  summary: string;
  checks: {
    title: string;
    status: AuditCheckStatus;
    message: string;
  }[];
}

export type AnalysisResultCategories = {
  seo: ScoreBlock;
  performance: ScoreBlock;
  trust: ScoreBlock;
  conversion: ScoreBlock;
  design: ScoreBlock;
  aiVisibility: ScoreBlock;
};

export interface AnalysisScreenshots {
  fullPage?: string;
  viewport?: string;
  mobile?: string;
  hero?: string;
}

export interface AnalysisMetadata {
  source?: string;
  contactRequestId?: string;
  auditContextId?: string;
  leadContext?: Record<string, unknown>;
  auditContext?: Record<string, unknown>;
  screenshotError?: string;
  screenshotErrorSource?: "browser_launch" | "capture" | "storage" | "rendered_fallback";
  screenshotVariantFailures?: Array<{
    variant: string;
    reason: string;
  }>;
  screenshotVariantsAttempted?: string[];
  screenshotVariantsStored?: string[];
  renderedModeRequested?: boolean;
  runtime?: string;
}

export interface ElementBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface VisualMap {
  pageWidth: number;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  buttons: ElementBox[];
  headings: ElementBox[];
  images: ElementBox[];
  forms: ElementBox[];
  links: ElementBox[];
}

export interface AiSuggestion {
  id: string;
  title: string;
  summary: string;
  actionSteps: string[];
  expectedImpact: PriorityLevel;
  category: AnalysisCategory;
  linkedFindingTitle?: string;
  linkedFindingKey?: string;
  hotspotId?: string;
}

export interface AnalysisResult {
  url: string;
  createdAt: string;
  requestedUrl: string;
  scannedAt: string;
  analysisMode: AnalysisMode;
  finalUrl?: string;
  technicalNotes?: string[];
  screenshots?: AnalysisScreenshots;
  visualPreviewAvailable?: boolean;
  metadata?: AnalysisMetadata;
  visualMap?: VisualMap;
  isPremium: boolean;
  totalFindings: number;
  visibleFindings: number;
  overallScore: number;
  categories: AnalysisResultCategories;
  quickWins: Recommendation[];
  criticalIssues: Recommendation[];
  premiumInsightsPreview: Recommendation[];
  revenueBlockers: RevenueBlocker[];
  measures: ActionMeasure[];
  categoryScores: Partial<Record<AnalysisCategory, CategoryScore>>;
  findings: Finding[];
  recommendations: Recommendation[];
  aiSuggestions?: AiSuggestion[];
}

export interface CheckResult {
  score: number;
  findings: Finding[];
}
