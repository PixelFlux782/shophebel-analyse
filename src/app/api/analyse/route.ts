import { NextRequest, NextResponse } from "next/server";

import { createStoredAnalysisResult, saveAnalysisResult } from "@/lib/analysisStore";
import { AnalysePageError, analysePage } from "@/lib/analyse/analyse-page";
import { InvalidUrlError } from "@/lib/analyse/fetch-html";
import { AnalysisRequest } from "@/types/analysis";

export const runtime = "nodejs";

async function persistAnalysisBestEffort(analysis: Awaited<ReturnType<typeof analysePage>>) {
  try {
    return await saveAnalysisResult({ analysis });
  } catch (error) {
    console.error("analysis_persistence_failed", error);

    if (process.env.NODE_ENV !== "production") {
      return createStoredAnalysisResult({ analysis });
    }

    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalysisRequest;
    const analysis = await analysePage(body.url);
    const record = await persistAnalysisBestEffort(analysis);

    return NextResponse.json({
      ...(record ? { id: record.id } : {}),
      ...analysis,
    });
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
