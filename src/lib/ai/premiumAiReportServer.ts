import { createHash } from "crypto";

import { getAnalysisResult } from "@/lib/analysisStore";
import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import { createOpenRouterPremiumReportProvider, DEFAULT_OPENROUTER_MODEL, OpenRouterProviderError } from "@/lib/ai/openRouterPremiumReportProvider";
import { getPremiumAiReportByAnalysisId, savePremiumAiReportForAnalysis } from "@/lib/ai/premiumAiReportStore";
import { buildPremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import {
  buildFallbackPremiumAiReport,
  generatePremiumAiReport,
  generatePremiumAiReportWithUsage,
  PremiumAiReportValidationError,
} from "@/lib/ai/premiumReportService";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";

export const PREMIUM_AI_REPORT_VERSION = "premium-ai-report-v3";
const MOCK_PREMIUM_AI_MODEL = "shophebel-mock-premium-ai-report";

export type PremiumAiReportSource = "cache" | "generated" | "fallback";
export type PremiumAiProviderName = "mock" | "openrouter";

export type PremiumAiRuntimeConfig = {
  enabled: boolean;
  providerName: PremiumAiProviderName;
  model: string;
  allowRegenerate: boolean;
};

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

function readBooleanEnv(name: string, defaultValue: boolean) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return defaultValue;
  }

  return value === "true" || value === "1" || value === "yes";
}

function readProviderEnv(): PremiumAiProviderName {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  return provider === "openrouter" ? "openrouter" : "mock";
}

export function resolvePremiumAiRuntimeConfig(input: {
  providerName?: string;
  model?: string;
} = {}): PremiumAiRuntimeConfig {
  const providerName = input.providerName === "openrouter" || input.providerName === "mock"
    ? input.providerName
    : readProviderEnv();

  return {
    enabled: readBooleanEnv("AI_ENABLED", true),
    providerName,
    model: input.model
      ?? (providerName === "openrouter"
        ? process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL
        : MOCK_PREMIUM_AI_MODEL),
    allowRegenerate: readBooleanEnv("ALLOW_AI_REGENERATE", false),
  };
}

function createDefaultProvider(providerName: PremiumAiProviderName) {
  return providerName === "openrouter"
    ? createOpenRouterPremiumReportProvider()
    : mockPremiumReportProvider;
}

function buildInputHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isReusableReport(input: {
  reportVersion?: string | null;
  inputHash?: string | null;
  status?: string | null;
}, inputHash: string, allowRegenerate: boolean) {
  if (!input.reportVersion && !input.inputHash) {
    return false;
  }

  if (input.reportVersion !== PREMIUM_AI_REPORT_VERSION || input.status === "failed") {
    return false;
  }

  if (!allowRegenerate) {
    return true;
  }

  return input.inputHash === inputHash;
}

function logPremiumAiFailure(message: string, details: { analysisId: string; code: string; error: unknown }) {
  console.warn("[premium-ai-report]", message, {
    analysisId: details.analysisId,
    code: details.code,
    error: details.error instanceof Error ? details.error.message : "unknown",
  });
}

function logPremiumAiUsage(input: {
  analysisId: string;
  providerName: PremiumAiProviderName | string;
  model: string;
  reportVersion: string;
  usage?: {
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
    estimatedCost?: number | null;
    isEstimated?: boolean | null;
  } | null;
}) {
  if (!input.usage) {
    return;
  }

  const payload = {
    provider: input.providerName,
    model: input.model,
    totalTokens: input.usage.totalTokens ?? null,
    promptTokens: input.usage.promptTokens ?? null,
    completionTokens: input.usage.completionTokens ?? null,
    estimatedCost: input.usage.estimatedCost ?? null,
    usageEstimated: input.usage.isEstimated ?? false,
    reportVersion: input.reportVersion,
    analysisId: input.analysisId,
  };

  if (input.providerName === "openrouter" && !input.usage.isEstimated) {
    console.info("[premium-ai-report:openrouter-cost]", payload);
    return;
  }

  console.info("[premium-ai-report:usage]", payload);
}

export async function getOrGeneratePremiumAiReport(input: {
  analysisId: unknown;
  provider?: PremiumReportProvider;
  providerName?: string;
  model?: string;
}): Promise<PremiumAiReportGenerationResult> {
  const analysisId = normalizeAnalysisId(input.analysisId);
  const runtimeConfig = resolvePremiumAiRuntimeConfig({
    providerName: input.providerName,
    model: input.model,
  });

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

  if (existingReport && isReusableReport(existingReport, inputHash, runtimeConfig.allowRegenerate)) {
    return {
      analysisId,
      source: "cache",
      report: existingReport.report,
    };
  }

  if (!runtimeConfig.enabled) {
    const fallbackReport = buildFallbackPremiumAiReport(reportInput);
    const saved = await savePremiumAiReportForAnalysis({
      analysisId,
      report: fallbackReport,
      provider: "fallback",
      model: runtimeConfig.model,
      status: "fallback",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash,
    });

    return {
      analysisId,
      source: "fallback",
      report: saved.report,
    };
  }

  try {
    const provider = input.provider ?? createDefaultProvider(runtimeConfig.providerName);
    const generated = await generatePremiumAiReportWithUsage(reportInput, provider);
    logPremiumAiUsage({
      analysisId,
      providerName: input.providerName ?? runtimeConfig.providerName,
      model: runtimeConfig.model,
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      usage: generated.usage,
    });
    const saved = await savePremiumAiReportForAnalysis({
      analysisId,
      report: generated.report,
      provider: input.providerName ?? runtimeConfig.providerName,
      model: runtimeConfig.model,
      status: "generated",
      reportVersion: PREMIUM_AI_REPORT_VERSION,
      inputHash,
      promptTokens: generated.usage?.promptTokens ?? null,
      completionTokens: generated.usage?.completionTokens ?? null,
      totalTokens: generated.usage?.totalTokens ?? null,
      estimatedCost: generated.usage?.estimatedCost ?? null,
      usageEstimated: generated.usage?.isEstimated ?? null,
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
          model: runtimeConfig.model,
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
