import { randomUUID } from "crypto";

import { AnalysisResult, AnalysisScreenshots } from "@/types/analysis";

export interface StoredAnalysisResult {
  id: string;
  analysis: AnalysisResult;
  createdAt: string;
  isDemo?: boolean;
  paymentStatus?: string | null;
  paidAt?: string | null;
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
  screenshots?: AnalysisScreenshots | null;
  metadata?: AnalysisResult["metadata"] | null;
  payment_status?: string | null;
  paid_at?: string | null;
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
    analysis: normalizeAnalysisResult(row.result, row.screenshots, row.metadata),
    createdAt: row.created_at,
    isDemo: row.is_demo,
    paymentStatus: row.payment_status ?? null,
    paidAt: row.paid_at ?? null,
  };
}

function normalizeScreenshots(screenshots: AnalysisResult["screenshots"] | null | undefined) {
  if (!screenshots || Array.isArray(screenshots)) {
    return undefined;
  }

  const normalized = {
    fullPage: typeof screenshots.fullPage === "string" && screenshots.fullPage ? screenshots.fullPage : undefined,
    viewport: typeof screenshots.viewport === "string" && screenshots.viewport ? screenshots.viewport : undefined,
    mobile: typeof screenshots.mobile === "string" && screenshots.mobile ? screenshots.mobile : undefined,
    hero: typeof screenshots.hero === "string" && screenshots.hero ? screenshots.hero : undefined,
  };

  return normalized.fullPage || normalized.viewport || normalized.mobile || normalized.hero
    ? normalized
    : undefined;
}

function hasVisualPreview(screenshots: AnalysisResult["screenshots"]) {
  return Boolean(screenshots?.viewport || screenshots?.fullPage || screenshots?.hero || screenshots?.mobile);
}

function normalizeAnalysisResult(
  analysis: AnalysisResult,
  fallbackScreenshots?: AnalysisScreenshots | null,
  fallbackMetadata?: AnalysisResult["metadata"] | null,
): AnalysisResult {
  const screenshots =
    normalizeScreenshots(analysis.screenshots) ?? normalizeScreenshots(fallbackScreenshots);
  const metadata = analysis.metadata ?? fallbackMetadata ?? undefined;

  return {
    ...analysis,
    screenshots,
    metadata,
    visualPreviewAvailable: hasVisualPreview(screenshots),
  };
}

function formatSupabaseRequestDebug({
  operation,
  requestUrl,
  status,
  responseText,
  error,
}: {
  operation: string;
  requestUrl: string;
  status?: number;
  responseText?: string;
  error?: unknown;
}) {
  const supabaseUrlSet = Boolean(process.env.SUPABASE_URL?.trim());
  const serviceRoleKeySet = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const networkErrorMessage = error instanceof Error ? error.message : String(error ?? "");
  const cause = error instanceof Error ? error.cause : undefined;
  const causeMessage = cause instanceof Error ? cause.message : "";
  const parts = [
    `${operation}: Supabase request failed`,
    `SUPABASE_URL set: ${supabaseUrlSet}`,
    `SUPABASE_SERVICE_ROLE_KEY set: ${serviceRoleKeySet}`,
    `Request URL: ${requestUrl}`,
  ];

  if (status !== undefined) {
    parts.push(`HTTP status: ${status}`);
  }

  if (responseText) {
    parts.push(`Response text: ${responseText}`);
  }

  if (networkErrorMessage) {
    parts.push(`Network error: ${networkErrorMessage}`);
  }

  if (causeMessage) {
    parts.push(`Network cause: ${causeMessage}`);
  }

  return parts.join(" | ");
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
  const analysis = normalizeAnalysisResult(input.analysis);
  const payload = {
    id,
    created_at: now,
    updated_at: now,
    requested_url: analysis.requestedUrl,
    final_url: analysis.finalUrl || analysis.url,
    overall_score: analysis.overallScore,
    analysis_mode: analysis.analysisMode,
    is_demo: Boolean(input.isDemo),
    result: analysis,
    screenshots: analysis.screenshots ?? null,
    visual_preview_available: analysis.visualPreviewAvailable,
    metadata: analysis.metadata ?? {},
  };

  const requestUrl = `${config.url}/rest/v1/analysis_results`;
  let response: Response;

  try {
    response = await fetch(requestUrl, {
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
  } catch (error) {
    throw new Error(formatSupabaseRequestDebug({
      operation: "supabase_analysis_insert_failed",
      requestUrl,
      error,
    }));
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(formatSupabaseRequestDebug({
      operation: "supabase_analysis_insert_failed",
      requestUrl,
      status: response.status,
      responseText: details,
    }));
  }

  const parsed = (await response.json()) as SupabaseAnalysisRow[];
  const row = parsed[0];

  if (!row) {
    return {
      id,
      analysis,
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
    analysis: normalizeAnalysisResult(input.analysis),
    isDemo: input.isDemo,
    paymentStatus: null,
    paidAt: null,
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

  const requestUrl = `${config.url}/rest/v1/analysis_results?id=eq.${encodeURIComponent(id)}&select=id,created_at,is_demo,result,screenshots,metadata,payment_status,paid_at&limit=1`;
  let response: Response;

  try {
    response = await fetch(
      requestUrl,
      {
        method: "GET",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
        },
        cache: "no-store",
      },
    );
  } catch (error) {
    throw new Error(formatSupabaseRequestDebug({
      operation: "supabase_analysis_select_failed",
      requestUrl,
      error,
    }));
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(formatSupabaseRequestDebug({
      operation: "supabase_analysis_select_failed",
      requestUrl,
      status: response.status,
      responseText: details,
    }));
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
