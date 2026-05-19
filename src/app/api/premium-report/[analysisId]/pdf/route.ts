import { NextResponse } from "next/server";

import { getAnalysisResult } from "@/lib/analysisStore";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";
import { renderPremiumReportPdf } from "@/lib/premium/premiumReportPdf";
import {
  getOrCreatePremiumReport,
  getPremiumReportRecordByAnalysisId,
} from "@/lib/premium/premiumReportStore";

export const runtime = "nodejs";

const noindexHeaders = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

interface PremiumReportPdfRouteContext {
  params: Promise<{
    analysisId: string;
  }>;
}

export async function GET(_request: Request, context: PremiumReportPdfRouteContext) {
  try {
    const { analysisId } = await context.params;

    if (!analysisId) {
      return NextResponse.json({ error: "Keine Analyse-ID übergeben." }, { status: 400, headers: noindexHeaders });
    }

    const analysis = await getAnalysisResult(analysisId);

    if (!analysis) {
      return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404, headers: noindexHeaders });
    }

    if (!canViewPremiumReport(analysis)) {
      return NextResponse.json({ error: "Premium-Report ist nicht freigeschaltet." }, { status: 403, headers: noindexHeaders });
    }

    const premiumReportRecord = await getPremiumReportRecordByAnalysisId(analysisId);
    const premiumReport = premiumReportRecord?.report ?? await getOrCreatePremiumReport({ analysis });

    if (!premiumReport) {
      console.error("[premium-report-pdf] Premium report could not be generated.", {
        analysisId,
        paymentStatus: analysis.paymentStatus,
        hadStoredReport: Boolean(premiumReportRecord),
      });

      return NextResponse.json({ error: "Premium-Report konnte nicht erstellt werden." }, { status: 500, headers: noindexHeaders });
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
        ...noindexHeaders,
      },
    });
  } catch (error) {
    console.error("[premium-report-pdf] PDF render failed.", error);

    return NextResponse.json({ error: "PDF konnte nicht erzeugt werden." }, { status: 500, headers: noindexHeaders });
  }
}
