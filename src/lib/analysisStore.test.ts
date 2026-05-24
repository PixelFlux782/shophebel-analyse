import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import { getAnalysisResult, saveAnalysisResult } from "@/lib/analysisStore";
import { AnalysisResult } from "@/types/analysis";

function createAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const now = new Date().toISOString();

  return {
    url: "https://shop.test/",
    createdAt: now,
    requestedUrl: "https://shop.test",
    scannedAt: now,
    analysisMode: "static",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    visualPreviewAvailable: false,
    isPremium: false,
    totalFindings: 0,
    visibleFindings: 0,
    overallScore: 80,
    categories: {
      seo: { score: 80, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 80, label: "Performance", summary: "OK", checks: [] },
      trust: { score: 80, label: "Trust", summary: "OK", checks: [] },
      conversion: { score: 80, label: "Conversion", summary: "OK", checks: [] },
      design: { score: 80, label: "Design", summary: "OK", checks: [] },
      aiVisibility: { score: 80, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [],
    measures: [],
    categoryScores: {},
    findings: [],
    recommendations: [],
    aiSuggestions: [],
    ...overrides,
  };
}

function resetMemoryStore() {
  (
    globalThis as typeof globalThis & {
      __shophebelAnalysisStore?: Map<string, unknown>;
    }
  ).__shophebelAnalysisStore = undefined;
}

async function resetGeneratedScreenshotFixture(filename: string) {
  const absolutePath = path.join(process.cwd(), "public", "generated-screenshots", filename);

  await rm(absolutePath, { force: true });

  return absolutePath;
}

describe("analysisStore", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    resetMemoryStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    resetMemoryStore();
  });

  it("speichert Analyse-Ergebnisse im Development im In-Memory-Fallback", async () => {
    const analysis = createAnalysisResult();
    const saved = await saveAnalysisResult({ analysis });

    expect(saved.id).toBeTruthy();
    expect(saved.analysis.url).toBe("https://shop.test/");
  });

  it("liest Analyse-Ergebnisse im Development aus dem In-Memory-Fallback", async () => {
    const analysis = createAnalysisResult();
    const saved = await saveAnalysisResult({ analysis, isDemo: true });
    const loaded = await getAnalysisResult(saved.id);

    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.analysis.requestedUrl).toBe("https://shop.test");
    expect(loaded?.isDemo).toBe(true);
  });

  it("erhaelt Lead-Verknuepfungen im lokalen Fallback", async () => {
    const contactRequestId = "11111111-1111-4111-8111-111111111111";
    const auditContextId = "22222222-2222-4222-8222-222222222222";
    const analysis = createAnalysisResult({
      metadata: {
        contactRequestId,
        auditContextId,
        leadContext: { company: "Test GmbH" },
      },
    });

    const saved = await saveAnalysisResult({
      analysis,
      contactRequestId,
      auditContextId,
    });

    expect(saved.contactRequestId).toBe(contactRequestId);
    expect(saved.auditContextId).toBe(auditContextId);
    expect(saved.analysis.metadata?.leadContext).toEqual({ company: "Test GmbH" });
  });

  it("normalisiert leere Screenshot-Arrays im Fallback defensiv", async () => {
    const analysis = createAnalysisResult({
      screenshots: [] as unknown as AnalysisResult["screenshots"],
      visualPreviewAvailable: true,
    });

    const saved = await saveAnalysisResult({ analysis });

    expect(saved.analysis.screenshots).toBeUndefined();
    expect(saved.analysis.visualPreviewAvailable).toBe(false);
  });

  it("blockt Production ohne Supabase-Konfiguration klar", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(saveAnalysisResult({ analysis: createAnalysisResult() })).rejects.toThrow(
      "Analysis persistence is not configured",
    );
    await expect(getAnalysisResult("missing-id")).rejects.toThrow(
      "Analysis persistence is not configured",
    );
  });

  it("meldet Supabase-Netzwerkfehler ohne Secret auszugeben", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(
      new Error("fetch failed", { cause: new Error("unable to verify the first certificate") }),
    ));

    await expect(saveAnalysisResult({ analysis: createAnalysisResult() })).rejects.toThrow(
      "Network error: fetch failed",
    );

    try {
      await saveAnalysisResult({ analysis: createAnalysisResult() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toContain("SUPABASE_URL set: true");
      expect(message).toContain("SUPABASE_SERVICE_ROLE_KEY set: true");
      expect(message).toContain("Request URL: https://example.supabase.co/rest/v1/analysis_results");
      expect(message).toContain("Network cause: unable to verify the first certificate");
      expect(message).not.toContain("secret-service-role-key");
    }
  });

  it("meldet Supabase-HTTP-Fehler mit Status und Response Text", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(
      new Response("relation analysis_results does not exist", { status: 404 }),
    )));

    await expect(saveAnalysisResult({ analysis: createAnalysisResult() })).rejects.toThrow(
      "HTTP status: 404",
    );
    await expect(saveAnalysisResult({ analysis: createAnalysisResult() })).rejects.toThrow(
      "Response text: relation analysis_results does not exist",
    );
  });

  it("persistiert Screenshot-URLs vollständig in Supabase", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const screenshots = {
      viewport: "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/viewport.png",
      fullPage: "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/full.png",
      mobile: "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/mobile.png",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await saveAnalysisResult({
      analysis: createAnalysisResult({
        screenshots,
        visualPreviewAvailable: true,
      }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      screenshots: typeof screenshots;
      visual_preview_available: boolean;
      result: AnalysisResult;
      metadata: AnalysisResult["metadata"];
    };

    expect(payload.screenshots).toEqual(screenshots);
    expect(payload.result.screenshots).toEqual(screenshots);
    expect(payload.visual_preview_available).toBe(true);
    expect(payload.result.visualPreviewAvailable).toBe(true);
  });

  it("persistiert Screenshot-Fehler in Supabase metadata", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await saveAnalysisResult({
      analysis: createAnalysisResult({
        metadata: {
          screenshotError: "Chromium executable not found",
          screenshotErrorSource: "browser_launch",
          renderedModeRequested: true,
          runtime: "vercel",
        },
      }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      metadata: AnalysisResult["metadata"];
      result: AnalysisResult;
    };

    expect(payload.metadata).toEqual({
      screenshotError: "Chromium executable not found",
      screenshotErrorSource: "browser_launch",
      renderedModeRequested: true,
      runtime: "vercel",
    });
    expect(payload.result.metadata?.screenshotError).toBe("Chromium executable not found");
  });

  it("persistiert optionale Lead- und Audit-IDs in Supabase-Spalten und Metadata", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const contactRequestId = "11111111-1111-4111-8111-111111111111";
    const auditContextId = "22222222-2222-4222-8222-222222222222";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await saveAnalysisResult({
      analysis: createAnalysisResult({
        metadata: {
          contactRequestId,
          auditContextId,
          leadContext: { email: "kontakt@example.test" },
          auditContext: { website_url: "https://shop.test" },
        },
      }),
      contactRequestId,
      auditContextId,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      contact_request_id: string;
      audit_context_id: string;
      metadata: AnalysisResult["metadata"];
      result: AnalysisResult;
    };

    expect(payload.contact_request_id).toBe(contactRequestId);
    expect(payload.audit_context_id).toBe(auditContextId);
    expect(payload.metadata?.contactRequestId).toBe(contactRequestId);
    expect(payload.metadata?.auditContextId).toBe(auditContextId);
    expect(payload.metadata?.leadContext).toEqual({ email: "kontakt@example.test" });
    expect(payload.result.metadata?.auditContext).toEqual({ website_url: "https://shop.test" });
  });

  it("retryt Supabase-Speicherung ohne Relation-Spalten, wenn die Migration fehlt", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const contactRequestId = "11111111-1111-4111-8111-111111111111";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("Could not find the 'contact_request_id' column", { status: 400 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 201 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const saved = await saveAnalysisResult({
      analysis: createAnalysisResult({
        metadata: { contactRequestId },
      }),
      contactRequestId,
    });

    const [, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [, retryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const firstPayload = JSON.parse(firstInit.body as string) as { contact_request_id?: string };
    const retryPayload = JSON.parse(retryInit.body as string) as {
      contact_request_id?: string;
      metadata: AnalysisResult["metadata"];
    };

    expect(firstPayload.contact_request_id).toBe(contactRequestId);
    expect(retryPayload.contact_request_id).toBeUndefined();
    expect(retryPayload.metadata?.contactRequestId).toBe(contactRequestId);
    expect(saved.contactRequestId).toBe(contactRequestId);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[analysis-store] analysis_results lead linkage insert failed; retrying without relation columns. Apply the documented migration for contact_request_id and audit_context_id.",
      expect.objectContaining({
        contactRequestId,
      }),
    );
  });

  it("normalisiert alte Supabase-Ergebnisse mit leerem Screenshot-Array beim Lesen", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const stored = {
      id: "analysis-123",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult({
        screenshots: [] as unknown as AnalysisResult["screenshots"],
        visualPreviewAvailable: true,
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-123");

    expect(loaded?.analysis.screenshots).toBeUndefined();
    expect(loaded?.analysis.visualPreviewAvailable).toBe(false);
  });

  it("liest vorhandene lokale Screenshot-URLs aus dem separaten Supabase-Screenshots-Feld", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const viewportFile = "analysis-test-viewport.png";
    const mobileFile = "analysis-test-mobile.png";
    const viewportPath = await resetGeneratedScreenshotFixture(viewportFile);
    const mobilePath = await resetGeneratedScreenshotFixture(mobileFile);

    await mkdir(path.dirname(viewportPath), { recursive: true });
    await writeFile(viewportPath, Buffer.from("viewport"));
    await writeFile(mobilePath, Buffer.from("mobile"));

    const screenshots = {
      viewport: `/generated-screenshots/${viewportFile}`,
      mobile: `/generated-screenshots/${mobileFile}`,
    };
    const stored = {
      id: "analysis-456",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult({
        screenshots: undefined,
        visualPreviewAvailable: false,
      }),
      screenshots,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-456");

    expect(loaded?.analysis.screenshots).toEqual(screenshots);
    expect(loaded?.analysis.visualPreviewAvailable).toBe(true);

    await resetGeneratedScreenshotFixture(viewportFile);
    await resetGeneratedScreenshotFixture(mobileFile);
  });

  it("zeigt fehlende lokale Screenshot-Dateien als Fallback statt toter URL", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const stored = {
      id: "analysis-missing-screenshot",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult({
        screenshots: {
          viewport: "/generated-screenshots/does-not-exist.png",
        },
        visualPreviewAvailable: true,
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-missing-screenshot");

    expect(loaded?.analysis.screenshots).toBeUndefined();
    expect(loaded?.analysis.visualPreviewAvailable).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[analysis-store] Local screenshot file is missing or empty",
      expect.objectContaining({
        expectedPath: expect.stringContaining(path.join("public", "generated-screenshots", "does-not-exist.png")),
      }),
    );
  });

  it("behandelt relative generated-screenshots in Production als unstabil", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const stored = {
      id: "analysis-production-local-screenshot",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult({
        screenshots: {
          viewport: "/generated-screenshots/old-local.png",
        },
        visualPreviewAvailable: true,
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-production-local-screenshot");

    expect(loaded?.analysis.screenshots).toBeUndefined();
    expect(loaded?.analysis.visualPreviewAvailable).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[analysis-store] Ignoring legacy local screenshot path in production",
      expect.objectContaining({
        src: "/generated-screenshots/old-local.png",
      }),
    );
  });

  it("liest Screenshot-Fehler aus dem separaten Supabase-Metadata-Feld", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const stored = {
      id: "analysis-metadata",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult(),
      metadata: {
        screenshotError: "No usable Chromium executable",
        screenshotErrorSource: "browser_launch",
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-metadata");

    expect(loaded?.analysis.metadata?.screenshotError).toBe("No usable Chromium executable");
    expect(loaded?.analysis.metadata?.screenshotErrorSource).toBe("browser_launch");
  });

  it("liest Payment-Status für Premium-Zugriff aus Supabase", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");

    const stored = {
      id: "analysis-paid",
      created_at: "2026-05-08T12:00:00.000Z",
      is_demo: false,
      result: createAnalysisResult(),
      payment_status: "paid",
      paid_at: "2026-05-08T12:30:00.000Z",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([stored]), { status: 200 }),
    ));

    const loaded = await getAnalysisResult("analysis-paid");

    expect(loaded?.paymentStatus).toBe("paid");
    expect(loaded?.paidAt).toBe("2026-05-08T12:30:00.000Z");
  });
});
