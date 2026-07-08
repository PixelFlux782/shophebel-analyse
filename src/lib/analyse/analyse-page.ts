import { AnalysisResult } from "@/types/analysis";
import { FetchHtmlError, InvalidUrlError, fetchHtml } from "@/lib/analyse/fetch-html";
import {
  FetchRenderedHtmlError,
  FetchRenderedHtmlResult,
  fetchRenderedHtml,
} from "@/lib/analyse/fetch-rendered-html";
import { BrowserLaunchError } from "@/lib/analyse/browser";
import { runConversionChecks } from "@/lib/analyse/checks/conversion-checks";
import { runSeoChecks } from "@/lib/analyse/checks/seo-checks";
import { runTrustChecks } from "@/lib/analyse/checks/trust-checks";
import { runUxChecks } from "@/lib/analyse/checks/ux-checks";
import { generateSuggestions } from "@/lib/ai/generate-suggestions";
import { buildRecommendations } from "@/lib/analyse/recommendations";
import { buildAnalysisResult, createCategoryScore } from "@/lib/analyse/scoring";
import { buildAnalysisOpportunities } from "@/lib/analyse/opportunity-engine";
import { shouldUseRenderedFallback } from "@/lib/analyse/content-quality";
import { fetchRobotsTxt } from "@/lib/analyse/fetch-robots";
import {
  buildAuditCategories,
  buildAuditRecommendations,
  buildRevenueBlockers,
} from "@/lib/analyse/audit-result";
import { buildActionMeasures } from "@/lib/analyse/measure-engine";

type StaticDocument = Awaited<ReturnType<typeof fetchHtml>>;

export class AnalysePageError extends Error {}

function isEnvEnabled(value: string | undefined) {
  return ["1", "true", "yes", "on", "rendered"].includes(value?.trim().toLowerCase() ?? "");
}

function isEnvDisabled(value: string | undefined) {
  return ["0", "false", "no", "off", "static"].includes(value?.trim().toLowerCase() ?? "");
}

export function shouldPreferRenderedAnalysis() {
  const explicitMode = process.env.SHOPHEBEL_ANALYSIS_MODE;
  const renderedAnalysis = process.env.SHOPHEBEL_RENDERED_ANALYSIS;

  if (isEnvDisabled(explicitMode) || isEnvDisabled(renderedAnalysis)) {
    return false;
  }

  if (isEnvEnabled(explicitMode) || isEnvEnabled(renderedAnalysis)) {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

function getRuntimeLabel() {
  if (process.env.VERCEL) {
    return "vercel";
  }

  return process.env.NODE_ENV ?? "unknown";
}

async function buildResultFromDocument(
  document: StaticDocument | FetchRenderedHtmlResult,
  input: {
    analysisMode: "static" | "rendered";
    technicalNotes: string[];
    metadata?: AnalysisResult["metadata"];
    pageSignals?: FetchRenderedHtmlResult["pageSignals"];
    screenshots?: FetchRenderedHtmlResult["screenshots"];
    visualMap?: FetchRenderedHtmlResult["visualMap"];
  },
): Promise<AnalysisResult> {
  const robotsTxt = await fetchRobotsTxt(document.finalUrl);
  const context = {
    pageUrl: document.finalUrl,
    pageSignals: input.pageSignals,
  };
  const seo = runSeoChecks(document.html);
  const trust = runTrustChecks(document.html, context);
  const conversion = runConversionChecks(document.html, context);
  const ux = runUxChecks(document.html, context);
  const findings = [...seo.findings, ...trust.findings, ...conversion.findings, ...ux.findings];
  const recommendations = buildRecommendations(findings);
  const categories = buildAuditCategories({
    html: document.html,
    finalUrl: document.finalUrl,
    context,
    loadTimeMs: document.loadTimeMs,
    visualMap: input.visualMap,
    screenshotsAvailable: Boolean(input.screenshots?.viewport || input.screenshots?.fullPage),
    robotsTxt,
  });
  const auditRecommendations = buildAuditRecommendations(categories);
  const revenueBlockers = buildRevenueBlockers(categories);
  const measures = buildActionMeasures(categories);

  const result = buildAnalysisResult({
    requestedUrl: document.requestedUrl,
    finalUrl: document.finalUrl,
    analysisMode: input.analysisMode,
    technicalNotes: input.technicalNotes,
    metadata: input.metadata,
    screenshots: input.screenshots,
    visualMap: input.visualMap,
    categoryScores: {
      seo: createCategoryScore("seo", categories.seo.score),
      performance: createCategoryScore("performance", categories.performance.score),
      trust: createCategoryScore("trust", categories.trust.score),
      conversion: createCategoryScore("conversion", categories.conversion.score),
      design: createCategoryScore("design", categories.design.score),
      aiVisibility: createCategoryScore("aiVisibility", categories.aiVisibility.score),
      ux: createCategoryScore("ux", ux.score),
    },
    categories,
    quickWins: auditRecommendations.quickWins,
    criticalIssues: auditRecommendations.criticalIssues,
    premiumInsightsPreview: auditRecommendations.premiumInsightsPreview,
    revenueBlockers,
    measures,
    findings,
    recommendations,
  });

  result.aiSuggestions = await generateSuggestions(result);
  result.opportunities = buildAnalysisOpportunities({
    revenueBlockers: result.revenueBlockers,
    measures: result.measures,
    findings: result.findings,
    aiSuggestions: result.aiSuggestions,
    overallScore: result.overallScore,
    url: result.url,
  });

  return result;
}

type AnalysePageOptions = {
  preferRendered?: boolean;
};

export async function analysePage(inputUrl: string, options: AnalysePageOptions = {}): Promise<AnalysisResult> {
  const technicalNotes: string[] = [];
  let staticDocument: StaticDocument | null = null;
  let staticError: FetchHtmlError | null = null;

  try {
    staticDocument = await fetchHtml(inputUrl);
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      throw error;
    }

    if (error instanceof FetchHtmlError) {
      staticError = error;
    } else {
      throw new AnalysePageError("Die Seite konnte in diesem Lauf nicht verlaesslich geprüft werden.");
    }
  }

  const useRenderedFallback = shouldUseRenderedFallback({
    html: staticDocument?.html,
    staticFetchFailed: Boolean(staticError),
  });
  const preferRenderedAnalysis = options.preferRendered || shouldPreferRenderedAnalysis();
  const renderedModeRequested = preferRenderedAnalysis || useRenderedFallback;

  console.info("[analysis] rendered mode decision", {
    renderedModeRequested,
    preferRenderedAnalysis,
    useRenderedFallback,
    staticFetchFailed: Boolean(staticError),
    hadStaticDocument: Boolean(staticDocument),
    envRenderedAnalysis: process.env.SHOPHEBEL_RENDERED_ANALYSIS ?? null,
    envAnalysisMode: process.env.SHOPHEBEL_ANALYSIS_MODE ?? null,
    runtime: getRuntimeLabel(),
  });

  if (!useRenderedFallback && staticDocument && !preferRenderedAnalysis) {
    technicalNotes.push("Seite wurde per statischem HTML analysiert.");

    return buildResultFromDocument(staticDocument, {
      analysisMode: "static",
      technicalNotes,
    });
  }

  if (staticDocument) {
    technicalNotes.push(
      "Die erste Seitenfassung war zu dünn, daher wurde eine echte Browseransicht genutzt.",
    );
  } else if (staticError) {
    technicalNotes.push(
      "Der erste Abruf ist fehlgeschlagen, daher wurde eine echte Browseransicht genutzt.",
    );
  }

  if (preferRenderedAnalysis && staticDocument && !useRenderedFallback) {
    technicalNotes.push(
      options.preferRendered
        ? "Premium-Mehrseitenanalyse nutzt eine echte Browseransicht fuer Screenshots."
        : "Lokale Entwicklungsanalyse nutzt eine echte Browseransicht für Screenshots.",
    );
  }

  try {
    console.info("[analysis] rendered analysis started", {
      reason: preferRenderedAnalysis ? "rendered_analysis_enabled" : "static_fallback_needed",
      staticFetchFailed: Boolean(staticError),
      hadStaticDocument: Boolean(staticDocument),
      environment: process.env.VERCEL ? "vercel" : process.env.NODE_ENV,
    });

    const renderedDocument = await fetchRenderedHtml(inputUrl);
    technicalNotes.push(
      "Die Analyse basiert auf der Seite, wie sie im Browser sichtbar wird.",
    );
    if (renderedDocument.screenshots?.viewport || renderedDocument.screenshots?.fullPage) {
      technicalNotes.push(
        "Visuelle Vorschau wurde aus der sichtbaren Seitenansicht erstellt.",
      );
    }
    if (renderedDocument.screenshotError) {
      technicalNotes.push(
        "Screenshot-Erstellung war nicht moeglich, Analyse wurde dennoch abgeschlossen.",
      );
    }

    return buildResultFromDocument(renderedDocument, {
      analysisMode: "rendered",
      technicalNotes,
      pageSignals: renderedDocument.pageSignals,
      screenshots: renderedDocument.screenshots,
      visualMap: renderedDocument.visualMap,
      metadata: renderedDocument.screenshotError
        ? {
            screenshotError: renderedDocument.screenshotError,
            screenshotErrorSource: renderedDocument.screenshotErrorSource,
            screenshotVariantFailures: renderedDocument.screenshotVariantFailures,
            screenshotVariantsAttempted: ["viewport", "fullPage", "mobile"],
            screenshotVariantsStored: Object.entries(renderedDocument.screenshots ?? {})
              .filter(([, value]) => Boolean(value))
              .map(([key]) => key),
            renderedModeRequested: true,
            runtime: getRuntimeLabel(),
          }
        : {
            screenshotVariantsAttempted: ["viewport", "fullPage", "mobile"],
            screenshotVariantsStored: Object.entries(renderedDocument.screenshots ?? {})
              .filter(([, value]) => Boolean(value))
              .map(([key]) => key),
            renderedModeRequested: true,
            runtime: getRuntimeLabel(),
          },
    });
  } catch (error) {
    if (staticDocument) {
      const screenshotError = error instanceof Error ? error.message : "unknown";
      console.warn("[analysis] fallback to static because rendered analysis failed", {
        reason: screenshotError,
        runtime: getRuntimeLabel(),
      });
      technicalNotes.push(
        "Der Browser-Fallback war nicht erfolgreich. Es wird die statische HTML-Auswertung verwendet.",
      );

      return buildResultFromDocument(staticDocument, {
        analysisMode: "static",
        technicalNotes,
        metadata: {
          screenshotError,
          screenshotErrorSource: error instanceof BrowserLaunchError ? "browser_launch" : "rendered_fallback",
          renderedModeRequested,
          runtime: getRuntimeLabel(),
        },
      });
    }

    if (error instanceof FetchRenderedHtmlError) {
      throw new AnalysePageError(error.message);
    }

    if (staticError) {
      throw new AnalysePageError(
        `Die Seite konnte in diesem Lauf nicht verlaesslich geprüft werden. ${staticError.message}`,
      );
    }

    throw new AnalysePageError("Die Seite konnte in diesem Lauf nicht verlaesslich geprüft werden.");
  }
}
