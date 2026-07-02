import { NextRequest, NextResponse } from "next/server";

import { getOrGeneratePremiumAiReport, PremiumAiReportRequestError } from "@/lib/ai/premiumAiReportServer";

export const runtime = "nodejs";

type PremiumAiReportRequestBody = {
  analysisId?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PremiumAiReportRequestBody;
    const result = await getOrGeneratePremiumAiReport({
      analysisId: body.analysisId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Ungueltiger JSON-Request.", code: "invalid_json" },
        { status: 400 },
      );
    }

    if (error instanceof PremiumAiReportRequestError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("[premium-ai-report] unexpected failure", error);

    return NextResponse.json(
      { error: "KI-Premiumanalyse konnte nicht erstellt werden.", code: "internal_error" },
      { status: 500 },
    );
  }
}
