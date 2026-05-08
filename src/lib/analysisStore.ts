import { randomUUID } from "crypto";

import { AnalysisResult } from "@/types/analysis";

export interface StoredAnalysisResult {
  id: string;
  analysis: AnalysisResult;
  createdAt: string;
  isDemo?: boolean;
}

type SaveAnalysisResultInput = {
  analysis: AnalysisResult;
  isDemo?: boolean;
};

type SupabaseAnalysisRow = {
  id: string;
  created_at: string;
  is_demo?: boolean;
  result: AnalysisResult;
};

declare global {
  var __shophebelAnalysisStore: Map<string, StoredAnalysisResult> | undefined;
}

function getMemoryStore() {
  if (!global.__shophebelAnalysisStore) {
    global.__shophebelAnalysisStore = new Map<string, StoredAnalysisResult>();
  }

  return global.__shophebelAnalysisStore;
}

function getSupabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function shouldAllowMemoryFallback() {
  return process.env.NODE_ENV !== "production";
}

function assertPersistenceConfigured() {
  if (!shouldAllowMemoryFallback()) {
    throw new Error("Analysis persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
}

function toStoredAnalysisResult(row: SupabaseAnalysisRow): StoredAnalysisResult {
  return {
    id: row.id,
    analysis: row.result,
    createdAt: row.created_at,
    isDemo: row.is_demo,
  };
}

async function saveAnalysisResultSupabase(
  input: SaveAnalysisResultInput,
): Promise<StoredAnalysisResult> {
  const config = getSupabaseConfig();

  if (!config) {
    assertPersistenceConfigured();
    return saveAnalysisResultMemory(input);
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const payload = {
    id,
    created_at: now,
    updated_at: now,
    requested_url: input.analysis.requestedUrl,
    final_url: input.analysis.finalUrl || input.analysis.url,
    overall_score: input.analysis.overallScore,
    analysis_mode: input.analysis.analysisMode,
    is_demo: Boolean(input.isDemo),
    result: input.analysis,
    screenshots: input.analysis.screenshots ?? null,
    visual_preview_available: Boolean(input.analysis.visualPreviewAvailable),
    metadata: {},
  };

  const response = await fetch(`${config.url}/rest/v1/analysis_results`, {
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

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`supabase_analysis_insert_failed: ${response.status} ${details}`);
  }

  const parsed = (await response.json()) as SupabaseAnalysisRow[];
  const row = parsed[0];

  if (!row) {
    return {
      id,
      analysis: input.analysis,
      createdAt: now,
      isDemo: input.isDemo,
    };
  }

  return toStoredAnalysisResult(row);
}

function saveAnalysisResultMemory(input: SaveAnalysisResultInput): StoredAnalysisResult {
  const id = randomUUID();
  const record: StoredAnalysisResult = {
    id,
    createdAt: new Date().toISOString(),
    analysis: input.analysis,
    isDemo: input.isDemo,
  };

  getMemoryStore().set(id, record);

  return record;
}

async function getAnalysisResultSupabase(id: string): Promise<StoredAnalysisResult | null> {
  const config = getSupabaseConfig();

  if (!config) {
    assertPersistenceConfigured();
    return getMemoryStore().get(id) ?? null;
  }

  const response = await fetch(
    `${config.url}/rest/v1/analysis_results?id=eq.${encodeURIComponent(id)}&select=id,created_at,is_demo,result&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`supabase_analysis_select_failed: ${response.status} ${details}`);
  }

  const parsed = (await response.json()) as SupabaseAnalysisRow[];
  const row = parsed[0];

  return row ? toStoredAnalysisResult(row) : null;
}

export async function saveAnalysisResult(input: SaveAnalysisResultInput): Promise<StoredAnalysisResult> {
  return saveAnalysisResultSupabase(input);
}

export async function getAnalysisResult(id: string): Promise<StoredAnalysisResult | null> {
  return getAnalysisResultSupabase(id);
}

export function createStoredAnalysisResult(input: SaveAnalysisResultInput) {
  assertPersistenceConfigured();
  return saveAnalysisResultMemory(input);
}

export function getStoredAnalysisResult(id: string) {
  assertPersistenceConfigured();
  return getMemoryStore().get(id) ?? null;
}
