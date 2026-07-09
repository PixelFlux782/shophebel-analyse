import { NextResponse } from "next/server";

import { PREMIUM_AI_REPORT_VERSION } from "@/lib/ai/premiumAiReportServer";
import { premiumAiReportSchema } from "@/lib/ai/premiumAiReport.schema";
import { getPremiumAiReportByAnalysisId } from "@/lib/ai/premiumAiReportStore";
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
    const premiumReport = await getOrCreatePremiumReport({ analysis });

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

    const aiReportRecord = await getPremiumAiReportByAnalysisId(analysisId).catch((error) => {
      console.warn("[premium-report-pdf] Stored AI report could not be loaded; PDF continues without it.", {
        analysisId,
        error: error instanceof Error ? error.message : "unknown",
      });
      return null;
    });
    const parsedAiReport = aiReportRecord?.reportVersion === PREMIUM_AI_REPORT_VERSION
      ? premiumAiReportSchema.safeParse(aiReportRecord.report)
      : null;
    const aiReport = parsedAiReport?.success ? parsedAiReport.data : null;

    const pdf = await renderPremiumReportPdf({
      analysis,
      report: premiumReport,
      consultantNotes: premiumReportRecord?.consultantNotes ?? {},
      aiReport,
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
