import { createHash } from "crypto";

import { getAnalysisResult } from "@/lib/analysisStore";
import { createOpenRouterPremiumReportProvider, DEFAULT_OPENROUTER_MODEL, OpenRouterProviderError } from "@/lib/ai/openRouterPremiumReportProvider";
import { getPremiumAiReportByAnalysisId, savePremiumAiReportForAnalysis } from "@/lib/ai/premiumAiReportStore";
import { buildPremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import { buildFallbackPremiumAiReport, generatePremiumAiReport, PremiumAiReportValidationError } from "@/lib/ai/premiumReportService";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";

export const PREMIUM_AI_REPORT_VERSION = "premium-ai-report-v2";

export type PremiumAiReportSource = "cache" | "generated" | "fallback";

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

function buildInputHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isReusableReport(input: {
  reportVersion?: string | null;
  inputHash?: string | null;
  status?: string | null;
}, inputHash: string) {
  if (!input.reportVersion && !input.inputHash) {
    return false;
  }

  return input.reportVersion === PREMIUM_AI_REPORT_VERSION && input.inputHash === inputHash && input.status !== "failed";
}

function logPremiumAiFailure(message: string, details: { analysisId: string; code: string; error: unknown }) {
  console.warn("[premium-ai-report]", message, {
    analysisId: details.analysisId,
    code: details.code,
    error: details.error instanceof Error ? details.error.message : "unknown",
  });
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

  const reportInput = buildPremiumReportInput(analysis.analysis);
  const inputHash = buildInputHash(reportInput);

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

  if (existingReport && isReusableReport(existingReport, inputHash)) {
    return {
      analysisId,
      source: "cache",
      report: existingReport.report,
    };
  }

  try {
    const provider = input.provider ?? createDefaultProvider();
    const report = await generatePremiumAiReport(reportInput, provider);
    const saved = await savePremiumAiReportForAnalysis({
      analysisId,
      report,
      provider: input.providerName ?? "openrouter",
      model: input.model ?? process.env.OPENROUTER_MODEL?.trim() ?? DEFAULT_OPENROUTER_MODEL,
      status: "generated",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash,
    });

    return {
      analysisId,
      source: "generated",
      report: saved.report,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("premium_ai_report")) {
      throw new PremiumAiReportRequestError(
        "save_failed",
        "KI-Premiumreport wurde erstellt, konnte aber nicht gespeichert werden.",
        500,
        { cause: error },
      );
    }

    if (
      error instanceof OpenRouterProviderError ||
      error instanceof PremiumAiReportValidationError ||
      error instanceof Error
    ) {
      const missingApiKey = error.message.includes("OPENROUTER_API_KEY");
      const fallbackReport = buildFallbackPremiumAiReport(reportInput);
      const code = error instanceof PremiumAiReportValidationError
        ? "invalid_ai_response"
        : missingApiKey
          ? "openrouter_key_missing"
          : "provider_error";

      logPremiumAiFailure("Provider failed; using fallback report.", { analysisId, code, error });

      try {
        const saved = await savePremiumAiReportForAnalysis({
          analysisId,
          report: fallbackReport,
          provider: input.providerName ?? "fallback",
          model: input.model ?? process.env.OPENROUTER_MODEL?.trim() ?? DEFAULT_OPENROUTER_MODEL,
          status: "fallback",
          reportVersion: PREMIUM_AI_REPORT_VERSION,
          inputHash,
        });

        return {
          analysisId,
          source: "fallback",
          report: saved.report,
        };
      } catch (saveError) {
        throw new PremiumAiReportRequestError(
          "fallback_save_failed",
          "KI-Beratung konnte nur als Ersatzbericht erstellt, aber nicht gespeichert werden.",
          500,
          { cause: saveError },
        );
      }
    }

    throw new PremiumAiReportRequestError(
      "provider_error",
      "OpenRouter konnte den KI-Premiumreport nicht erstellen.",
      502,
      { cause: error },
    );
  }
}
