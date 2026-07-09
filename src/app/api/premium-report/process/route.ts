import { NextRequest, NextResponse } from "next/server";

import { getAnalysisResult } from "@/lib/analysisStore";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";
import { getOrCreatePremiumReport } from "@/lib/premium/premiumReportStore";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const analysisId = new URL(request.url).searchParams.get("analysisId")?.trim();

  if (!analysisId) {
    return NextResponse.json({ error: "Analyse-ID fehlt." }, { status: 400 });
  }

  const analysis = await getAnalysisResult(analysisId);

  if (!analysis) {
    return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
  }

  if (!canViewPremiumReport(analysis)) {
    return NextResponse.json({ status: "payment_pending" });
  }

  try {
    const report = await getOrCreatePremiumReport({ analysis });

    if (!report) {
      return NextResponse.json(
        { error: "Premium-Report konnte nicht erstellt werden." },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ready" });
  } catch (error) {
    console.error("[premium-report-process] report preparation failed", {
      analysisId,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Premium-Report konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
