import { randomUUID } from "crypto";

import type { StoredAnalysisResult } from "@/lib/analysisStore";
import { buildPremiumReport } from "@/lib/premium/buildPremiumReport";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { ConsultantNotes } from "@/lib/premium/consultantNotes";
import { normalizeConsultantNotes } from "@/lib/premium/consultantNotes";
import { canViewPremiumReport } from "@/lib/premium/premiumAccess";

type SavePremiumReportInput = {
  analysisId: string;
  paymentId?: string | null;
  report: PremiumReport;
};

type GetOrCreatePremiumReportInput = {
  analysis: StoredAnalysisResult;
  paymentId?: string | null;
};

export type PremiumReportRecord = {
  id: string;
  analysisId: string;
  paymentId?: string | null;
  report: PremiumReport;
  consultantNotes: ConsultantNotes;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  version?: string | null;
};

type SupabasePremiumReportRow = {
  id: string;
  analysis_id: string;
  payment_id?: string | null;
  report: PremiumReport;
  consultant_notes?: ConsultantNotes | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  version?: string | null;
};

function getSupabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function logPremiumReportError(operation: string, error: unknown) {
  console.error(`[premium-report-store] ${operation} failed`, error);
}

function toPremiumReportRecord(row: SupabasePremiumReportRow): PremiumReportRecord {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    paymentId: row.payment_id ?? null,
    report: row.report,
    consultantNotes: normalizeConsultantNotes(row.consultant_notes),
    status: row.status ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    version: row.version ?? null,
  };
}

export async function getPremiumReportRecordByAnalysisId(
  analysisId: string,
): Promise<PremiumReportRecord | null> {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const requestUrl = `${config.url}/rest/v1/premium_reports?analysis_id=eq.${encodeURIComponent(analysisId)}&select=id,analysis_id,payment_id,report,consultant_notes,status,created_at,updated_at,version&order=created_at.desc&limit=1`;

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`supabase_premium_report_select_failed: ${response.status} ${await response.text()}`);
    }

    const rows = (await response.json()) as SupabasePremiumReportRow[];

    return rows[0] ? toPremiumReportRecord(rows[0]) : null;
  } catch (error) {
    logPremiumReportError("get", error);
    return null;
  }
}

export async function getPremiumReportByAnalysisId(analysisId: string): Promise<PremiumReport | null> {
  const record = await getPremiumReportRecordByAnalysisId(analysisId);

  return record?.report ?? null;
}

export async function savePremiumReportForAnalysis(
  input: SavePremiumReportInput,
): Promise<PremiumReport | null> {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const now = new Date().toISOString();
  const payload = {
    id: randomUUID(),
    analysis_id: input.analysisId,
    payment_id: input.paymentId ?? null,
    report: input.report,
    status: "generated",
    created_at: now,
    updated_at: now,
    version: "v1",
  };
  const requestUrl = `${config.url}/rest/v1/premium_reports`;

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (response.status === 409) {
      return getPremiumReportByAnalysisId(input.analysisId);
    }

    if (!response.ok) {
      throw new Error(`supabase_premium_report_insert_failed: ${response.status} ${await response.text()}`);
    }

    const rows = (await response.json()) as SupabasePremiumReportRow[];

    return rows[0]?.report ?? input.report;
  } catch (error) {
    logPremiumReportError("save", error);
    return null;
  }
}

export async function saveConsultantNotesForAnalysis(input: {
  analysisId: string;
  consultantNotes: ConsultantNotes;
}): Promise<PremiumReportRecord | null> {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const notes = normalizeConsultantNotes(input.consultantNotes);
  const requestUrl = `${config.url}/rest/v1/premium_reports?analysis_id=eq.${encodeURIComponent(input.analysisId)}`;

  try {
    const response = await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        consultant_notes: notes,
        status: "refined",
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`supabase_premium_report_notes_update_failed: ${response.status} ${await response.text()}`);
    }

    const rows = (await response.json()) as SupabasePremiumReportRow[];

    return rows[0] ? toPremiumReportRecord(rows[0]) : null;
  } catch (error) {
    logPremiumReportError("save-notes", error);
    return null;
  }
}

export async function getOrCreatePremiumReport(
  input: GetOrCreatePremiumReportInput,
): Promise<PremiumReport | null> {
  if (!canViewPremiumReport(input.analysis)) {
    return null;
  }

  const existingReport = await getPremiumReportByAnalysisId(input.analysis.id);

  if (existingReport) {
    return existingReport;
  }

  const generatedReport = buildPremiumReport({
    analysis: input.analysis.analysis,
    paymentStatus: input.analysis.paymentStatus,
  });
  const savedReport = await savePremiumReportForAnalysis({
    analysisId: input.analysis.id,
    paymentId: input.paymentId,
    report: generatedReport,
  });

  return savedReport ?? generatedReport;
}
