import { NextResponse } from "next/server";

import { getOrGeneratePremiumAiReport } from "@/lib/ai/premiumAiReportServer";
import { createStoredAnalysisResult } from "@/lib/analysisStore";
import { buildAnalysisOpportunities } from "@/lib/analyse/opportunity-engine";
import { DEMO_ANALYSES } from "@/lib/demoData";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  process.env.AI_PROVIDER = process.env.AI_PROVIDER?.trim() || "mock";
  process.env.AI_ENABLED = process.env.AI_ENABLED?.trim() || "true";
  process.env.ALLOW_AI_REGENERATE = process.env.ALLOW_AI_REGENERATE?.trim() || "false";
  process.env.SUPABASE_URL = "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";

  const createdAt = new Date().toISOString();
  const analysis = {
    createdAt,
    ...DEMO_ANALYSES.onlineshop,
    isPremium: true,
  };

  analysis.opportunities =
    analysis.opportunities ??
    buildAnalysisOpportunities({
      revenueBlockers: analysis.revenueBlockers,
      measures: analysis.measures,
      findings: analysis.findings,
      aiSuggestions: analysis.aiSuggestions,
      overallScore: analysis.overallScore,
      url: analysis.url,
    });

  const record = createStoredAnalysisResult({ analysis, isDemo: true });

  record.accessLevel = "premium";
  record.paymentStatus = "paid";
  record.paidAt = createdAt;
  record.plan = "premium";
  record.productType = "premium_report";
  record.isPremium = true;
  record.stripeSessionId = "cs_test_mock_premium_ai_fixture";
  record.analysis.isPremium = true;

  const aiReport = await getOrGeneratePremiumAiReport({ analysisId: record.id });

  return NextResponse.json({
    id: record.id,
    resultUrl: `/analyse/result/${record.id}`,
    pdfUrl: `/api/premium-report/${record.id}/pdf`,
    aiReportSource: aiReport.source,
    plan: record.plan,
    paymentStatus: record.paymentStatus,
  });
}
