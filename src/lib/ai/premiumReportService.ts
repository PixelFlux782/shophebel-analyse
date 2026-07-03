import { buildPremiumReportPrompt } from "@/lib/ai/promptBuilder";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import { premiumAiReportSchema, type PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { normalizeGermanReportText, validateReportCopyQuality } from "@/lib/report/reportCopy";

export class PremiumAiReportValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PremiumAiReportValidationError";
  }
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fencedJson?.[1]?.trim() ?? trimmed;
}

function extractJsonObject(raw: string): string {
  const unfenced = stripJsonFence(raw);
  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < firstBrace) {
    return unfenced;
  }

  return unfenced.slice(firstBrace, lastBrace + 1);
}

function normalizeStringList(values: string[]) {
  return values.map((value) => normalizeGermanReportText(value)).filter(Boolean);
}

export function normalizePremiumAiReportCopy(report: PremiumAiReport): PremiumAiReport {
  return {
    executiveSummary: normalizeGermanReportText(report.executiveSummary),
    mainDiagnosis: normalizeGermanReportText(report.mainDiagnosis),
    scoreExplanation: normalizeGermanReportText(report.scoreExplanation),
    topIssues: report.topIssues.map((issue) => ({
      ...issue,
      title: normalizeGermanReportText(issue.title),
      whyItMatters: normalizeGermanReportText(issue.whyItMatters),
      evidence: normalizeStringList(issue.evidence),
      recommendedAction: normalizeGermanReportText(issue.recommendedAction),
    })),
    actionPlan: report.actionPlan.map((step) => ({
      ...step,
      title: normalizeGermanReportText(step.title),
      description: normalizeGermanReportText(step.description),
    })),
    exampleImprovements: {
      heroTextIdeas: normalizeStringList(report.exampleImprovements.heroTextIdeas),
      ctaIdeas: normalizeStringList(report.exampleImprovements.ctaIdeas),
      trustElementIdeas: normalizeStringList(report.exampleImprovements.trustElementIdeas),
    },
    disclaimer: normalizeGermanReportText(report.disclaimer),
  };
}

export function parsePremiumAiReportResponse(raw: string): PremiumAiReport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch (error) {
    throw new PremiumAiReportValidationError("Premium AI report response is not valid JSON.", { cause: error });
  }

  const result = premiumAiReportSchema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
    throw new PremiumAiReportValidationError(`Premium AI report response failed validation: ${details}`, {
      cause: result.error,
    });
  }

  const normalizedReport = normalizePremiumAiReportCopy(result.data);
  const quality = validateReportCopyQuality(JSON.stringify(normalizedReport));

  if (!quality.isValid) {
    throw new PremiumAiReportValidationError(
      `Premium AI report response failed copy-quality validation: ${[
        ...quality.forbiddenTerms,
        ...quality.mojibakeMatches,
      ].join("; ")}`,
    );
  }

  return normalizedReport;
}

export async function generatePremiumAiReport(
  input: PremiumReportInput,
  provider: PremiumReportProvider = mockPremiumReportProvider,
): Promise<PremiumAiReport> {
  const prompt = buildPremiumReportPrompt(input);
  const rawReport = await provider.generate(prompt.messages);

  return parsePremiumAiReportResponse(rawReport);
}
