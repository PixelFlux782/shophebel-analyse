import { randomUUID } from "crypto";

import { AnalysisResult, AnalysisScreenshots } from "@/types/analysis";

export interface StoredAnalysisResult {
  id: string;
  analysis: AnalysisResult;
  createdAt: string;
  isDemo?: boolean;
  contactRequestId?: string | null;
  auditContextId?: string | null;
  paymentStatus?: string | null;
  paidAt?: string | null;
  plan?: string | null;
  productType?: string | null;
  isPremium?: boolean | null;
  stripeSessionId?: string | null;
}

type SaveAnalysisResultInput = {
  analysis: AnalysisResult;
  isDemo?: boolean;
  contactRequestId?: string;
  auditContextId?: string;
};

type SupabaseAnalysisRow = {
  id: string;
  created_at: string;
  is_demo?: boolean;
  result: AnalysisResult;
  screenshots?: AnalysisScreenshots | null;
  metadata?: AnalysisResult["metadata"] | null;
  contact_request_id?: string | null;
  audit_context_id?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
  plan?: string | null;
  product_type?: string | null;
  is_premium?: boolean | null;
  stripe_session_id?: string | null;
};

type SupabaseConfig = { url: string; serviceRoleKey: string };

declare global {
  var __shophebelAnalysisStore: Map<string, StoredAnalysisResult> | undefined;
}

function getMemoryStore() {
  if (!global.__shophebelAnalysisStore) {
    global.__shophebelAnalysisStore = new Map<string, StoredAnalysisResult>();
  }

  return global.__shophebelAnalysisStore;
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function parseSupabasePublicStorageUrl(value: string, config: SupabaseConfig) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const supabaseUrl = new URL(config.url);

  if (url.origin !== supabaseUrl.origin) {
    return null;
  }

  const prefix = "/storage/v1/object/public/";

  if (!url.pathname.startsWith(prefix)) {
    return null;
  }

  const [bucket, ...pathParts] = url.pathname.slice(prefix.length).split("/");
  const storagePath = pathParts.map(decodeURIComponent).join("/");

  if (!bucket || !storagePath) {
    return null;
  }

  return {
    bucket: decodeURIComponent(bucket),
    storagePath,
  };
}

async function createSignedScreenshotUrl(value: string, config: SupabaseConfig) {
  const parsed = parseSupabasePublicStorageUrl(value, config);

  if (!parsed) {
    return value;
  }

  const requestUrl = `${config.url.replace(/\/+$/, "")}/storage/v1/object/sign/${encodeURIComponent(parsed.bucket)}/${parsed.storagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      body: JSON.stringify({ expiresIn: 60 * 60 }),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.warn("[analysis-store] screenshot signed URL creation failed", {
        status: response.status,
        details,
        bucket: parsed.bucket,
        storagePath: parsed.storagePath,
      });
      return value;
    }

    const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
    const signedPath = payload.signedURL ?? payload.signedUrl;

    if (!signedPath) {
      console.warn("[analysis-store] screenshot signed URL response did not contain a URL", {
        bucket: parsed.bucket,
        storagePath: parsed.storagePath,
      });
      return value;
    }

    if (signedPath.startsWith("http")) {
      return signedPath;
    }

    const normalizedSignedPath = signedPath.startsWith("/object/")
      ? `/storage/v1${signedPath}`
      : signedPath;

    return `${config.url.replace(/\/+$/, "")}${normalizedSignedPath}`;
  } catch (error) {
    console.warn("[analysis-store] screenshot signed URL creation threw", {
      reason: error instanceof Error ? error.message : "unknown",
      bucket: parsed.bucket,
      storagePath: parsed.storagePath,
    });
    return value;
  }
}

async function resolveScreenshotUrls(
  screenshots: AnalysisScreenshots | undefined,
  config: SupabaseConfig,
) {
  if (!screenshots) {
    return undefined;
  }

  const resolved: AnalysisScreenshots = {};
  const entries: Array<keyof AnalysisScreenshots> = ["viewport", "fullPage", "mobile", "hero"];

  await Promise.all(entries.map(async (key) => {
    const value = screenshots[key];

    if (value) {
      resolved[key] = await createSignedScreenshotUrl(value, config);
    }
  }));

  return normalizeScreenshots(resolved);
}

function shouldAllowMemoryFallback() {
  return process.env.NODE_ENV !== "production";
}

function assertPersistenceConfigured() {
  if (!shouldAllowMemoryFallback()) {
    throw new Error("Analysis persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
}

async function toStoredAnalysisResult(row: SupabaseAnalysisRow, config: SupabaseConfig): Promise<StoredAnalysisResult> {
  const analysis = normalizeAnalysisResult(row.result, row.screenshots, row.metadata);
  const screenshots = await resolveScreenshotUrls(analysis.screenshots, config);

  return {
    id: row.id,
    analysis: {
      ...analysis,
      screenshots,
      visualPreviewAvailable: hasVisualPreview(screenshots),
    },
    createdAt: row.created_at,
    isDemo: row.is_demo,
    contactRequestId: row.contact_request_id ?? analysis.metadata?.contactRequestId ?? null,
    auditContextId: row.audit_context_id ?? analysis.metadata?.auditContextId ?? null,
    paymentStatus: row.payment_status ?? null,
    paidAt: row.paid_at ?? null,
    plan: row.plan ?? null,
    productType: row.product_type ?? null,
    isPremium: row.is_premium ?? analysis.isPremium ?? null,
    stripeSessionId: row.stripe_session_id ?? null,
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

function shouldRetryWithoutLeadLinkage(responseText: string) {
  const normalized = responseText.toLowerCase();

  return (
    normalized.includes("contact_request_id") ||
    normalized.includes("audit_context_id") ||
    normalized.includes("contact_requests") ||
    normalized.includes("audit_contexts") ||
    normalized.includes("foreign key")
  );
}

function shouldRetryWithoutAccessColumns(responseText: string) {
  const normalized = responseText.toLowerCase();

  return (
    normalized.includes("payment_status") ||
    normalized.includes("product_type") ||
    normalized.includes("plan")
  );
}

function buildAnalysisInsertPayload({
  id,
  now,
  analysis,
  input,
  includeLeadLinkage,
  includeAccessColumns,
}: {
  id: string;
  now: string;
  analysis: AnalysisResult;
  input: SaveAnalysisResultInput;
  includeLeadLinkage: boolean;
  includeAccessColumns: boolean;
}) {
  return {
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
    ...(includeAccessColumns
      ? {
          payment_status: "free",
          plan: "free",
          product_type: "analysis_teaser",
        }
      : {}),
    ...(includeLeadLinkage
      ? {
          contact_request_id: input.contactRequestId ?? null,
          audit_context_id: input.auditContextId ?? null,
        }
      : {}),
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
  const analysis = normalizeAnalysisResult(input.analysis);
  const hasLeadLinkage = Boolean(input.contactRequestId || input.auditContextId);

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
      body: JSON.stringify(buildAnalysisInsertPayload({
        id,
        now,
        analysis,
        input,
        includeLeadLinkage: hasLeadLinkage,
        includeAccessColumns: true,
      })),
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

    if (hasLeadLinkage && shouldRetryWithoutLeadLinkage(details)) {
      console.warn("[analysis-store] analysis_results lead linkage insert failed; retrying without relation columns. Apply the documented migration for contact_request_id and audit_context_id.", {
        status: response.status,
        details,
        contactRequestId: input.contactRequestId ?? null,
        auditContextId: input.auditContextId ?? null,
      });

      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(buildAnalysisInsertPayload({
          id,
          now,
          analysis,
          input,
          includeLeadLinkage: false,
          includeAccessColumns: true,
        })),
        cache: "no-store",
      });

      if (response.ok) {
        const parsed = (await response.json()) as SupabaseAnalysisRow[];
        const row = parsed[0];

        return row
          ? toStoredAnalysisResult(row, config)
          : {
              id,
              analysis,
              createdAt: now,
              isDemo: input.isDemo,
              contactRequestId: input.contactRequestId ?? null,
              auditContextId: input.auditContextId ?? null,
              paymentStatus: "free",
              plan: "free",
              productType: "analysis_teaser",
            };
      }
    }

    if (shouldRetryWithoutAccessColumns(details)) {
      console.warn("[analysis-store] analysis_results access columns missing; retrying insert without plan/payment fields. Apply the documented three-tier migration.", {
        status: response.status,
        details,
      });

      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(buildAnalysisInsertPayload({
          id,
          now,
          analysis,
          input,
          includeLeadLinkage: hasLeadLinkage,
          includeAccessColumns: false,
        })),
        cache: "no-store",
      });

      if (response.ok) {
        const parsed = (await response.json()) as SupabaseAnalysisRow[];
        const row = parsed[0];

        return row
          ? toStoredAnalysisResult(row, config)
          : {
              id,
              analysis,
              createdAt: now,
              isDemo: input.isDemo,
              contactRequestId: input.contactRequestId ?? null,
              auditContextId: input.auditContextId ?? null,
              paymentStatus: "free",
              plan: "free",
              productType: "analysis_teaser",
            };
      }
    }

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
      contactRequestId: input.contactRequestId ?? null,
      auditContextId: input.auditContextId ?? null,
    };
  }

  return toStoredAnalysisResult(row, config);
}

function saveAnalysisResultMemory(input: SaveAnalysisResultInput): StoredAnalysisResult {
  const id = randomUUID();
  const record: StoredAnalysisResult = {
    id,
    createdAt: new Date().toISOString(),
    analysis: normalizeAnalysisResult(input.analysis),
    isDemo: input.isDemo,
    contactRequestId: input.contactRequestId ?? input.analysis.metadata?.contactRequestId ?? null,
    auditContextId: input.auditContextId ?? input.analysis.metadata?.auditContextId ?? null,
    paymentStatus: null,
    paidAt: null,
    plan: "free",
    productType: "analysis_teaser",
    isPremium: input.analysis.isPremium,
    stripeSessionId: null,
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

  const extendedSelect = "id,created_at,is_demo,result,screenshots,metadata,contact_request_id,audit_context_id,payment_status,paid_at,plan,product_type,is_premium,stripe_session_id";
  const basicSelect = "id,created_at,is_demo,result,screenshots,metadata,contact_request_id,audit_context_id,payment_status,paid_at";
  let requestUrl = `${config.url}/rest/v1/analysis_results?id=eq.${encodeURIComponent(id)}&select=${extendedSelect}&limit=1`;
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
    const shouldRetryBasicSelect =
      details.toLowerCase().includes("plan") ||
      details.toLowerCase().includes("product_type") ||
      details.toLowerCase().includes("is_premium") ||
      details.toLowerCase().includes("stripe_session_id");

    if (shouldRetryBasicSelect) {
      requestUrl = `${config.url}/rest/v1/analysis_results?id=eq.${encodeURIComponent(id)}&select=${basicSelect}&limit=1`;
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

      if (response.ok) {
        const parsed = (await response.json()) as SupabaseAnalysisRow[];
        const row = parsed[0];

        return row ? toStoredAnalysisResult(row, config) : null;
      }
    }

    throw new Error(formatSupabaseRequestDebug({
      operation: "supabase_analysis_select_failed",
      requestUrl,
      status: response.status,
      responseText: details,
    }));
  }

  const parsed = (await response.json()) as SupabaseAnalysisRow[];
  const row = parsed[0];

  return row ? toStoredAnalysisResult(row, config) : null;
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
