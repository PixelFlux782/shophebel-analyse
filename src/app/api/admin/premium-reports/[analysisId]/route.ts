import { NextResponse } from "next/server";

import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { getAnalysisResult } from "@/lib/analysisStore";
import { normalizeConsultantNotes } from "@/lib/premium/consultantNotes";
import {
  getPremiumReportRecordByAnalysisId,
  saveConsultantNotesForAnalysis,
} from "@/lib/premium/premiumReportStore";

export const runtime = "nodejs";

interface AdminPremiumReportRouteContext {
  params: Promise<{
    analysisId: string;
  }>;
}

export async function GET(request: Request, context: AdminPremiumReportRouteContext) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedResponse();
  }

  const { analysisId } = await context.params;
  const analysis = await getAnalysisResult(analysisId);

  if (!analysis) {
    return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
  }

  const premiumReport = await getPremiumReportRecordByAnalysisId(analysisId);

  if (!premiumReport) {
    return NextResponse.json({ error: "Premium-Report nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({
    analysis,
    premiumReport,
  });
}

export async function PATCH(request: Request, context: AdminPremiumReportRouteContext) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedResponse();
  }

  const { analysisId } = await context.params;
  const analysis = await getAnalysisResult(analysisId);

  if (!analysis) {
    return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
  }

  const existingReport = await getPremiumReportRecordByAnalysisId(analysisId);

  if (!existingReport) {
    return NextResponse.json({ error: "Premium-Report nicht gefunden." }, { status: 404 });
  }

  const body = await request.json();
  const consultantNotes = normalizeConsultantNotes(
    body && typeof body === "object" && "consultantNotes" in body
      ? (body as { consultantNotes: unknown }).consultantNotes
      : body,
  );
  const savedReport = await saveConsultantNotesForAnalysis({
    analysisId,
    consultantNotes,
  });

  if (!savedReport) {
    return NextResponse.json({ error: "Consultant Notes konnten nicht gespeichert werden." }, { status: 500 });
  }

  return NextResponse.json({
    analysis,
    premiumReport: savedReport,
  });
}
