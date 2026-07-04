import { randomUUID } from "crypto";

import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";

export type PremiumAiReportRecord = {
  id: string;
  analysisId: string;
  report: PremiumAiReport;
  provider?: string | null;
  model?: string | null;
  status?: "pending" | "generated" | "failed" | "fallback" | string | null;
  reportVersion?: string | null;
  inputHash?: string | null;
  generatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SupabasePremiumAiReportRow = {
  id: string;
  analysis_id: string;
  report: PremiumAiReport;
  provider?: string | null;
  model?: string | null;
  status?: string | null;
  report_version?: string | null;
  input_hash?: string | null;
  generated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

declare global {
  var __shophebelPremiumAiReportStore: Map<string, PremiumAiReportRecord> | undefined;
}

function getMemoryStore() {
  if (!global.__shophebelPremiumAiReportStore) {
    global.__shophebelPremiumAiReportStore = new Map<string, PremiumAiReportRecord>();
  }

  return global.__shophebelPremiumAiReportStore;
}

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

function toPremiumAiReportRecord(row: SupabasePremiumAiReportRow): PremiumAiReportRecord {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    report: row.report,
    provider: row.provider ?? null,
    model: row.model ?? null,
    status: row.status ?? null,
    reportVersion: row.report_version ?? null,
    inputHash: row.input_hash ?? null,
    generatedAt: row.generated_at ?? row.created_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function getPremiumAiReportByAnalysisId(
  analysisId: string,
): Promise<PremiumAiReportRecord | null> {
  const config = getSupabaseConfig();

  if (!config) {
    return getMemoryStore().get(analysisId) ?? null;
  }

  const requestUrl = `${config.url}/rest/v1/premium_ai_reports?analysis_id=eq.${encodeURIComponent(analysisId)}&select=id,analysis_id,report,provider,model,status,report_version,input_hash,generated_at,created_at,updated_at&order=created_at.desc&limit=1`;
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`supabase_premium_ai_report_select_failed: ${response.status} ${await response.text()}`);
  }

  const rows = (await response.json()) as SupabasePremiumAiReportRow[];

  return rows[0] ? toPremiumAiReportRecord(rows[0]) : null;
}

export async function savePremiumAiReportForAnalysis(input: {
  analysisId: string;
  report: PremiumAiReport;
  provider?: string;
  model?: string;
  status?: PremiumAiReportRecord["status"];
  reportVersion?: string;
  inputHash?: string;
}): Promise<PremiumAiReportRecord> {
  const config = getSupabaseConfig();
  const now = new Date().toISOString();

  if (!config) {
    const existing = getMemoryStore().get(input.analysisId);

    if (existing) {
      return existing;
    }

    const record: PremiumAiReportRecord = {
      id: randomUUID(),
      analysisId: input.analysisId,
      report: input.report,
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: input.status ?? "generated",
      reportVersion: input.reportVersion ?? null,
      inputHash: input.inputHash ?? null,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    getMemoryStore().set(input.analysisId, record);
    return record;
  }

  const payload = {
    id: randomUUID(),
    analysis_id: input.analysisId,
    report: input.report,
    provider: input.provider ?? null,
    model: input.model ?? null,
    status: input.status ?? "generated",
    report_version: input.reportVersion ?? null,
    input_hash: input.inputHash ?? null,
    generated_at: now,
    created_at: now,
    updated_at: now,
  };
  const requestUrl = `${config.url}/rest/v1/premium_ai_reports`;
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
    const existing = await getPremiumAiReportByAnalysisId(input.analysisId);

    if (existing) {
      return existing;
    }
  }

  if (!response.ok) {
    throw new Error(`supabase_premium_ai_report_insert_failed: ${response.status} ${await response.text()}`);
  }

  const rows = (await response.json()) as SupabasePremiumAiReportRow[];
  const row = rows[0];

  if (!row) {
    throw new Error("supabase_premium_ai_report_insert_failed: empty response");
  }

  return toPremiumAiReportRecord(row);
}
