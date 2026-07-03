import { getAnalysisResult } from "@/lib/analysisStore";
import { createOpenRouterPremiumReportProvider, DEFAULT_OPENROUTER_MODEL, OpenRouterProviderError } from "@/lib/ai/openRouterPremiumReportProvider";
import { getPremiumAiReportByAnalysisId, savePremiumAiReportForAnalysis } from "@/lib/ai/premiumAiReportStore";
import { buildPremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import { generatePremiumAiReport, PremiumAiReportValidationError } from "@/lib/ai/premiumReportService";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";

export type PremiumAiReportSource = "cache" | "generated";

export type PremiumAiReportGenerationResult = {
  analysisId: string;
  source: PremiumAiReportSource;
  report: Awaited<ReturnType<typeof generatePremiumAiReport>>;
};

export class PremiumAiReportRequestError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PremiumAiReportRequestError";
    this.code = code;
    this.status = status;
  }
}

function normalizeAnalysisId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createDefaultProvider() {
  return createOpenRouterPremiumReportProvider();
}

export async function getOrGeneratePremiumAiReport(input: {
  analysisId: unknown;
  provider?: PremiumReportProvider;
  providerName?: string;
  model?: string;
}): Promise<PremiumAiReportGenerationResult> {
  const analysisId = normalizeAnalysisId(input.analysisId);

  if (!analysisId) {
    throw new PremiumAiReportRequestError(
      "missing_analysis_id",
      "Keine Analyse-ID für die KI-Premiumanalyse übergeben.",
      400,
    );
  }

  const analysis = await getAnalysisResult(analysisId);

  if (!analysis) {
    throw new PremiumAiReportRequestError(
      "analysis_not_found",
      "Analyse für die KI-Premiumanalyse nicht gefunden.",
      404,
    );
  }

  if (!canViewPremiumReport(analysis)) {
    throw new PremiumAiReportRequestError(
      "premium_access_required",
      "KI-Premiumanalyse ist nur für bezahlte Premium-Analysen verfügbar.",
      403,
    );
  }

  let existingReport: Awaited<ReturnType<typeof getPremiumAiReportByAnalysisId>>;

  try {
    existingReport = await getPremiumAiReportByAnalysisId(analysisId);
  } catch (error) {
    throw new PremiumAiReportRequestError(
      "storage_error",
      "KI-Premiumreport-Speicher konnte nicht gelesen werden.",
      500,
      { cause: error },
    );
  }

  if (existingReport) {
    return {
      analysisId,
      source: "cache",
      report: existingReport.report,
    };
  }

  try {
    const reportInput = buildPremiumReportInput(analysis.analysis);
    const provider = input.provider ?? createDefaultProvider();
    const report = await generatePremiumAiReport(reportInput, provider);
    const saved = await savePremiumAiReportForAnalysis({
      analysisId,
      report,
      provider: input.providerName ?? "openrouter",
      model: input.model ?? process.env.OPENROUTER_MODEL?.trim() ?? DEFAULT_OPENROUTER_MODEL,
    });

    return {
      analysisId,
      source: "generated",
      report: saved.report,
    };
  } catch (error) {
    if (error instanceof OpenRouterProviderError) {
      const missingApiKey = error.message.includes("OPENROUTER_API_KEY");

      throw new PremiumAiReportRequestError(
        missingApiKey ? "openrouter_key_missing" : "provider_error",
        missingApiKey
          ? "OpenRouter API-Key ist nicht konfiguriert."
          : "OpenRouter konnte den KI-Premiumreport nicht erstellen.",
        missingApiKey ? 503 : 502,
        { cause: error },
      );
    }

    if (error instanceof PremiumAiReportValidationError) {
      throw new PremiumAiReportRequestError(
        "invalid_ai_response",
        "Die KI-Antwort konnte nicht als Premiumreport validiert werden.",
        502,
        { cause: error },
      );
    }

    if (error instanceof Error && error.message.includes("premium_ai_report")) {
      throw new PremiumAiReportRequestError(
        "save_failed",
        "KI-Premiumreport wurde erstellt, konnte aber nicht gespeichert werden.",
        500,
        { cause: error },
      );
    }

    throw new PremiumAiReportRequestError(
      "provider_error",
      "OpenRouter konnte den KI-Premiumreport nicht erstellen.",
      502,
      { cause: error },
    );
  }
}
