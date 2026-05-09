import { NextResponse } from "next/server";

import { getAnalysisResult } from "@/lib/analysisStore";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";
import { renderPremiumReportPdf } from "@/lib/premium/premiumReportPdf";
import {
  getOrCreatePremiumReport,
  getPremiumReportRecordByAnalysisId,
} from "@/lib/premium/premiumReportStore";

export const runtime = "nodejs";

interface PremiumReportPdfRouteContext {
  params: Promise<{
    analysisId: string;
  }>;
}

export async function GET(_request: Request, context: PremiumReportPdfRouteContext) {
  try {
    const { analysisId } = await context.params;

    if (!analysisId) {
      return NextResponse.json({ error: "Keine Analyse-ID übergeben." }, { status: 400 });
    }

    const analysis = await getAnalysisResult(analysisId);

    if (!analysis) {
      return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
    }

    if (!canViewPremiumReport(analysis.paymentStatus)) {
      return NextResponse.json({ error: "Premium-Report ist nicht freigeschaltet." }, { status: 403 });
    }

    const premiumReportRecord = await getPremiumReportRecordByAnalysisId(analysisId);
    const premiumReport = premiumReportRecord?.report ?? await getOrCreatePremiumReport({ analysis });

    if (!premiumReport) {
      console.error("[premium-report-pdf] Premium report could not be generated.", {
        analysisId,
        paymentStatus: analysis.paymentStatus,
        hadStoredReport: Boolean(premiumReportRecord),
      });

      return NextResponse.json({ error: "Premium-Report konnte nicht erstellt werden." }, { status: 500 });
    }

    if (!premiumReportRecord) {
      console.warn("[premium-report-pdf] Stored premium report missing; using generated fallback.", {
        analysisId,
        paymentStatus: analysis.paymentStatus,
      });
    }

    const pdf = await renderPremiumReportPdf({
      analysis,
      report: premiumReport,
      consultantNotes: premiumReportRecord?.consultantNotes ?? {},
    });
    const filename = `shophebel-premium-report-${analysisId}.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[premium-report-pdf] PDF render failed.", error);

    return NextResponse.json({ error: "PDF konnte nicht erzeugt werden." }, { status: 500 });
  }
}
