import { NextRequest, NextResponse } from "next/server";

import { createStoredAnalysisResult, saveAnalysisResult } from "@/lib/analysisStore";
import { AnalysePageError, analysePage } from "@/lib/analyse/analyse-page";
import { InvalidUrlError } from "@/lib/analyse/fetch-html";
import { getAnalysisSummary } from "@/lib/result-ui";
import { AnalysisRequest } from "@/types/analysis";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeOptionalUuid(value: unknown, fieldName: "contactRequestId" | "auditContextId") {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const normalized = value.trim();

  if (!UUID_PATTERN.test(normalized)) {
    console.warn("[analysis] Ignoring invalid lead linkage UUID", {
      fieldName,
      value: normalized,
    });
    return undefined;
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function attachRequestContext(
  analysis: Awaited<ReturnType<typeof analysePage>>,
  requestBody: AnalysisRequest,
) {
  const contactRequestId = normalizeOptionalUuid(requestBody.contactRequestId, "contactRequestId");
  const auditContextId = normalizeOptionalUuid(requestBody.auditContextId, "auditContextId");
  const leadContext = isRecord(requestBody.leadContext) ? requestBody.leadContext : undefined;
  const auditContext = isRecord(requestBody.auditContext) ? requestBody.auditContext : undefined;
  const hasContext = Boolean(contactRequestId || auditContextId || leadContext || auditContext);

  if (!hasContext) {
    return { analysis, contactRequestId, auditContextId };
  }

  const existingMetadata = analysis.metadata ?? {};

  return {
    analysis: {
      ...analysis,
      metadata: {
        ...existingMetadata,
        source: existingMetadata.source,
        ...(contactRequestId ? { contactRequestId } : {}),
        ...(auditContextId ? { auditContextId } : {}),
        ...(leadContext ? { leadContext } : {}),
        ...(auditContext ? { auditContext } : {}),
      },
    },
    contactRequestId,
    auditContextId,
  };
}

async function persistAnalysisBestEffort(
  analysis: Awaited<ReturnType<typeof analysePage>>,
  input: {
    contactRequestId?: string;
    auditContextId?: string;
    isDemo?: boolean;
  } = {},
) {
  try {
    return await saveAnalysisResult({
      analysis,
      contactRequestId: input.contactRequestId,
      auditContextId: input.auditContextId,
      isDemo: input.isDemo,
    });
  } catch (error) {
    console.error("analysis_persistence_failed", error);

    if (process.env.NODE_ENV !== "production") {
      return createStoredAnalysisResult({
        analysis,
        contactRequestId: input.contactRequestId,
        auditContextId: input.auditContextId,
        isDemo: input.isDemo,
      });
    }

    return null;
  }
}

function buildFreeAnalysisResponse(
  analysis: Awaited<ReturnType<typeof analysePage>>,
  recordId?: string,
) {
  return {
    ...(recordId ? { id: recordId } : {}),
    url: analysis.url,
    requestedUrl: analysis.requestedUrl,
    finalUrl: analysis.finalUrl,
    scannedAt: analysis.scannedAt,
    analysisMode: analysis.analysisMode,
    overallScore: analysis.overallScore,
    summary: getAnalysisSummary(analysis),
    findings: analysis.findings.slice(0, 2).map((finding) => ({
      category: finding.category,
      status: finding.status,
      title: finding.title,
      description: finding.description,
    })),
    screenshots: analysis.screenshots?.viewport
      ? { viewport: analysis.screenshots.viewport }
      : undefined,
    visualPreviewAvailable: analysis.visualPreviewAvailable,
    plan: "free",
    paymentStatus: "free",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalysisRequest;
    const rawAnalysis = await analysePage(body.url);
    const {
      analysis,
      contactRequestId,
      auditContextId,
    } = attachRequestContext(rawAnalysis, body);
    const record = await persistAnalysisBestEffort(analysis, {
      contactRequestId,
      auditContextId,
      isDemo: body.isDemo,
    });
    const responseAnalysis = record?.analysis ?? analysis;

    return NextResponse.json(buildFreeAnalysisResponse(responseAnalysis, record?.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analyse konnte nicht erstellt werden.";

    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (error instanceof AnalysePageError) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
