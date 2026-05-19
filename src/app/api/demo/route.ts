import { NextRequest, NextResponse } from "next/server";

import { saveAnalysisResult } from "@/lib/analysisStore";
import { DEMO_ANALYSES } from "@/lib/demoData";
import { getAnalysisSummary } from "@/lib/result-ui";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !DEMO_ANALYSES[type]) {
      return NextResponse.json(
        { error: "Ungültiger Demo-Typ. Verfügbare Typen: onlineshop, handwerker, restaurant" },
        { status: 400 }
      );
    }

    const demoAnalysis = {
      createdAt: new Date().toISOString(),
      ...DEMO_ANALYSES[type],
    };
    const record = await saveAnalysisResult({ analysis: demoAnalysis, isDemo: true });

    return NextResponse.json({
      id: record.id,
      url: demoAnalysis.url,
      requestedUrl: demoAnalysis.requestedUrl,
      finalUrl: demoAnalysis.finalUrl,
      scannedAt: demoAnalysis.scannedAt,
      analysisMode: demoAnalysis.analysisMode,
      overallScore: demoAnalysis.overallScore,
      summary: getAnalysisSummary(demoAnalysis),
      findings: demoAnalysis.findings.slice(0, 2).map((finding) => ({
        category: finding.category,
        status: finding.status,
        title: finding.title,
        description: finding.description,
      })),
      screenshots: demoAnalysis.screenshots?.viewport
        ? { viewport: demoAnalysis.screenshots.viewport }
        : undefined,
      visualPreviewAvailable: demoAnalysis.visualPreviewAvailable,
      plan: "free",
      paymentStatus: "free",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo-Analyse konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
