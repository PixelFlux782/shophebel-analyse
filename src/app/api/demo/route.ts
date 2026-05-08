import { NextRequest, NextResponse } from "next/server";

import { saveAnalysisResult } from "@/lib/analysisStore";
import { DEMO_ANALYSES } from "@/lib/demoData";

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
      ...demoAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo-Analyse konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
